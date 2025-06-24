import { Application } from 'express';
import request from 'supertest';
import { WeatherLog } from '../src/entities/WeatherLog';
import { testDataSource } from './setup';

/**
 * Helper para criar uma instância de teste da aplicação
 */
export async function createTestApp(): Promise<Application> {
  // Importar dinamicamente para evitar problemas de inicialização
  const { createApp } = await import('../src/app');
  return createApp(testDataSource);
}

/**
 * Helper para criar dados de teste no banco
 */
export async function createTestWeatherData(data: Partial<WeatherLog>[]): Promise<WeatherLog[]> {
  const repository = testDataSource.getRepository(WeatherLog);
  const weatherLogs = data.map(item => repository.create({
    city: item.city || 'Test City',
    temperature: item.temperature || 25.0,
    description: item.description || 'Sunny',
    humidity: item.humidity || 60,
    windSpeed: item.windSpeed || 10.5,
    timestamp: item.timestamp || new Date(),
    ...item
  }));
  
  return await repository.save(weatherLogs);
}

/**
 * Helper para fazer requests autenticados (se necessário no futuro)
 */
export function authenticatedRequest(app: Application, token?: string) {
  const req = request(app);
  if (token) {
    return req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}

/**
 * Helper para verificar estrutura de resposta da API
 */
export function expectValidApiResponse(response: any, statusCode: number = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.headers['content-type']).toMatch(/json/);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('timestamp');
  return response.body.data;
}

/**
 * Helper para verificar estrutura de erro da API
 */
export function expectValidErrorResponse(response: any, statusCode: number) {
  expect(response.status).toBe(statusCode);
  expect(response.headers['content-type']).toMatch(/json/);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('timestamp');
  return response.body;
}

/**
 * Mock da API externa do OpenWeatherMap
 */
export const mockWeatherApiResponse = {
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
  name: 'Test City'
};

/**
 * Helper para mockar a API externa
 */
export function mockExternalWeatherApi() {
  const axios = require('axios');
  jest.spyOn(axios, 'get').mockResolvedValue({
    data: mockWeatherApiResponse
  });
}
