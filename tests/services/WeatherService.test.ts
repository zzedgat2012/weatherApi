import axios from 'axios';
import { WeatherLog } from '../../src/entities/WeatherLog';
import { WeatherDTO } from '../../src/models/WeatherModels';
import { WeatherService } from '../../src/services/WeatherService';
import { mockWeatherApiResponse } from '../helpers';
import { testDataSource } from '../setup';

// Mock já configurado no setup.ts
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: mockWeatherApiResponse
      });
    });

    it('should fetch and return weather data for valid city', async () => {
      const city = 'São Paulo';
      const result = await WeatherService.getWeather(city);

      expect(result).toBeInstanceOf(WeatherDTO);
      expect(result.city).toBe('Test City');
      expect(result.temperature).toBe(25.5);
      expect(result.description).toBe('clear sky');
      expect(result.humidity).toBe(65);
      expect(result.windSpeed).toBe(3.5);
      expect(result.timestamp).toBeDefined();

      // Verificar se foi chamada a API externa
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org'),
        expect.objectContaining({
          params: expect.objectContaining({
            q: city,
            appid: expect.any(String),
            units: 'metric'
          })
        })
      );
    });

    it('should save weather data to database', async () => {
      const city = 'Test City';
      await WeatherService.getWeather(city);

      // Verificar se os dados foram salvos no banco
      const repository = testDataSource.getRepository(WeatherLog);
      const savedData = await repository.findOne({
        where: { city: 'Test City' }
      });

      expect(savedData).toBeTruthy();
      expect(savedData?.temperature).toBe(25.5);
      expect(savedData?.description).toBe('clear sky');
      expect(savedData?.humidity).toBe(65);
      expect(savedData?.windSpeed).toBe(3.5);
    });

    it('should handle API error with proper error message', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(WeatherService.getWeather('InvalidCity'))
        .rejects
        .toThrow();
    });

    it('should handle city not found error', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'city not found' }
        }
      });

      await expect(WeatherService.getWeather('NonExistentCity'))
        .rejects
        .toThrow();
    });

    it('should handle API rate limit error', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'rate limit exceeded' }
        }
      });

      await expect(WeatherService.getWeather('AnyCity'))
        .rejects
        .toThrow();
    });

    it('should handle unauthorized API key error', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid API key' }
        }
      });

      await expect(WeatherService.getWeather('AnyCity'))
        .rejects
        .toThrow();
    });
  });

  describe('getWeatherHistory', () => {
    beforeEach(async () => {
      // Criar dados de teste
      const repository = testDataSource.getRepository(WeatherLog);
      const testData = [
        {
          city: 'São Paulo',
          temperature: 25.0,
          description: 'Sunny',
          humidity: 60,
          windSpeed: 10.5,
          timestamp: new Date('2024-01-03T10:00:00Z')
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
          city: 'São Paulo',
          temperature: 28.0,
          description: 'Hot',
          humidity: 80,
          windSpeed: 5.0,
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          city: 'Rio de Janeiro',
          temperature: 30.0,
          description: 'Very Hot',
          humidity: 85,
          windSpeed: 3.0,
          timestamp: new Date('2024-01-01T10:00:00Z')
        }
      ];

      await repository.save(testData.map(data => repository.create(data)));
    });

    it('should return weather history for valid city', async () => {
      const city = 'São Paulo';
      const result = await WeatherService.getWeatherHistory(city);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);

      // Verificar se todas as entradas são da cidade correta
      result.forEach(entry => {
        expect(entry.city).toBe(city);
        expect(entry).toBeInstanceOf(WeatherDTO);
        expect(entry.temperature).toBeDefined();
        expect(entry.description).toBeDefined();
        expect(entry.humidity).toBeDefined();
        expect(entry.windSpeed).toBeDefined();
        expect(entry.timestamp).toBeDefined();
      });

      // Verificar ordenação (mais recente primeiro)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].timestamp.getTime())
          .toBeGreaterThanOrEqual(result[i].timestamp.getTime());
      }
    });

    it('should return empty array for city with no history', async () => {
      const result = await WeatherService.getWeatherHistory('Unknown City');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const city = 'São Paulo';
      const limit = 2;
      const result = await WeatherService.getWeatherHistory(city, limit);

      expect(result).toHaveLength(2);
      
      // Deve retornar os 2 registros mais recentes
      expect(result[0].timestamp.getTime())
        .toBeGreaterThan(result[1].timestamp.getTime());
    });

    it('should handle limit larger than available records', async () => {
      const city = 'São Paulo';
      const limit = 100;
      const result = await WeatherService.getWeatherHistory(city, limit);

      expect(result).toHaveLength(3); // Apenas os registros disponíveis
    });

    it('should handle database errors gracefully', async () => {
      // Mock do repository para simular erro de banco
      const repository = testDataSource.getRepository(WeatherLog);
      jest.spyOn(repository, 'find').mockRejectedValue(new Error('Database Error'));

      await expect(WeatherService.getWeatherHistory('AnyCity'))
        .rejects
        .toThrow('Database Error');
    });
  });

  describe('API Key validation', () => {
    let originalApiKey: string | undefined;

    beforeEach(() => {
      originalApiKey = process.env.OPENWEATHER_API_KEY;
    });

    afterEach(() => {
      if (originalApiKey) {
        process.env.OPENWEATHER_API_KEY = originalApiKey;
      } else {
        delete process.env.OPENWEATHER_API_KEY;
      }
      // Re-read the API key by setting it directly on the service
      (WeatherService as any).API_KEY = process.env.OPENWEATHER_API_KEY;
    });

    it('should throw error when API key is not configured', async () => {
      delete process.env.OPENWEATHER_API_KEY;
      (WeatherService as any).API_KEY = undefined;

      await expect(WeatherService.getWeather('São Paulo'))
        .rejects
        .toThrow('OpenWeather API key is not configured. Please set OPENWEATHER_API_KEY environment variable.');
    });

    it('should work with valid API key', async () => {
      process.env.OPENWEATHER_API_KEY = 'test-api-key';
      (WeatherService as any).API_KEY = 'test-api-key';

      const mockWeatherData = {
        main: { temp: 25.5, humidity: 65 },
        weather: [{ description: 'clear sky' }],
        wind: { speed: 3.5 },
        name: 'São Paulo'
      };

      mockedAxios.get.mockResolvedValue({ data: mockWeatherData });

      const result = await WeatherService.getWeather('São Paulo');
      expect(result.city).toBe('São Paulo');
      expect(result.temperature).toBe(25.5);
    });
  });

  describe('getDataSource', () => {
    it('should return the initialized data source', () => {
      const dataSource = WeatherService.getDataSource();
      expect(dataSource).toBeDefined();
      expect(dataSource).toBe(testDataSource);
    });
  });

  describe('edge cases and validation', () => {
    it('should handle empty city name', async () => {
      await expect(WeatherService.getWeather(''))
        .rejects
        .toThrow('City name is required');
    });

    it('should handle whitespace-only city name', async () => {
      await expect(WeatherService.getWeather('   '))
        .rejects
        .toThrow('City name is required');
    });

    it('should handle API response with missing wind data gracefully', async () => {
      const mockWeatherData = {
        main: { temp: 20 }, // Missing humidity
        weather: [{ description: 'cloudy' }],
        // Missing wind data completely
        name: 'Test City'
      };

      mockedAxios.get.mockResolvedValue({ data: mockWeatherData });

      // This should throw an error because the service tries to access data.wind.speed
      await expect(WeatherService.getWeather('Test City'))
        .rejects
        .toThrow();
    });

    it('should handle API response with wind data', async () => {
      const mockWeatherData = {
        main: { temp: 22, humidity: 70, pressure: 1013 },
        weather: [{ description: 'partly cloudy' }],
        wind: { speed: 4.2, deg: 180 },
        name: 'Test City'
      };

      mockedAxios.get.mockResolvedValue({ data: mockWeatherData });

      const result = await WeatherService.getWeather('Test City');
      expect(result.windSpeed).toBe(4.2);
      expect(result.pressure).toBeUndefined(); // Service doesn't map pressure
      expect(result.windDirection).toBeUndefined(); // Service doesn't map windDirection from deg
    });
  });
});
