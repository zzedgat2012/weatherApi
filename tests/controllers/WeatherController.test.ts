import axios from 'axios';
import { Application } from 'express';
import request from 'supertest';
import { createTestApp, createTestWeatherData, expectValidApiResponse, expectValidErrorResponse } from '../helpers';
// Importar o controller para garantir que os decorators sejam registrados
import { WeatherController } from '../../src/controllers/WeatherController';

// Mock já configurado no setup.ts
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherController', () => {
  let app: Application;

  beforeAll(async () => {
    // Garantir que o controller seja carregado antes de criar o app
    console.log('WeatherController loaded:', WeatherController.name);
    app = await createTestApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      const data = expectValidApiResponse(response);
      expect(data).toHaveProperty('message', 'Weather API is running');
      expect(data).toHaveProperty('version', '1.0.0');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
    });
  });

  describe('GET /api/v1/weather/:city', () => {
    beforeEach(() => {
      // Mock da resposta da API externa
      mockedAxios.get.mockResolvedValue({
        data: {
          main: {
            temp: 25.5,
            humidity: 65
          },
          weather: [
            {
              description: 'clear sky'
            }
          ],
          wind: {
            speed: 3.5
          },
          name: 'São Paulo'
        }
      });
    });

    it('should return weather data for valid city', async () => {
      const city = 'São Paulo';
      const response = await request(app)
        .get(`/api/v1/weather/${city}`)
        .expect(200);

      const body = expectValidApiResponse(response);
      expect(body).toHaveProperty('city');
      expect(body).toHaveProperty('temperature');
      expect(body).toHaveProperty('description');
      expect(body).toHaveProperty('humidity');
      expect(body).toHaveProperty('windSpeed');
      expect(body).toHaveProperty('timestamp');

      // Verificar tipos de dados
      expect(typeof body.temperature).toBe('number');
      expect(typeof body.humidity).toBe('number');
      expect(typeof body.windSpeed).toBe('number');
      expect(typeof body.description).toBe('string');
    });

    it('should handle empty city parameter', async () => {
      const response = await request(app)
        .get('/api/v1/weather/ ')
        .expect(400);

      expectValidErrorResponse(response, 400);
    });

    it('should handle external API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/v1/weather/InvalidCity')
        .expect(500);

      expectValidErrorResponse(response, 500);
    });
  });

  describe('GET /api/v1/weather/:city/history', () => {
    beforeEach(async () => {
      // Criar dados de teste
      await createTestWeatherData([
        {
          city: 'São Paulo',
          temperature: 25.0,
          description: 'Sunny',
          humidity: 60,
          windSpeed: 10.5,
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          city: 'São Paulo',
          temperature: 22.0,
          description: 'Cloudy',
          humidity: 70,
          windSpeed: 8.0,
          timestamp: new Date('2024-01-02T10:00:00Z')
        },
        {
          city: 'Rio de Janeiro',
          temperature: 28.0,
          description: 'Hot',
          humidity: 80,
          windSpeed: 5.0,
          timestamp: new Date('2024-01-01T10:00:00Z')
        }
      ]);
    });

    it('should return weather history for valid city', async () => {
      const city = 'São Paulo';
      const response = await request(app)
        .get(`/api/v1/weather/${city}/history`)
        .expect(200);

      const body = expectValidApiResponse(response);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);

      // Verificar se todos os registros são da cidade correta
      body.forEach((record: any) => {
        expect(record.city).toBe(city);
        expect(record).toHaveProperty('temperature');
        expect(record).toHaveProperty('description');
        expect(record).toHaveProperty('humidity');
        expect(record).toHaveProperty('windSpeed');
        expect(record).toHaveProperty('timestamp');
      });
    });

    it('should return empty array for city with no history', async () => {
      const response = await request(app)
        .get('/api/v1/weather/UnknownCity/history')
        .expect(200);

      const body = expectValidApiResponse(response);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('should handle pagination with limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/weather/São Paulo/history?limit=1')
        .expect(200);

      const body = expectValidApiResponse(response);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expectValidErrorResponse(response, 404);
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/v1/health')
        .expect(404);

      expectValidErrorResponse(response, 404);
    });
  });
});
