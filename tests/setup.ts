import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WeatherLog } from '../src/entities/WeatherLog';
import { WeatherService } from '../src/services/WeatherService';

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
process.env.OPENWEATHER_API_KEY = 'test_api_key';

// Mock do axios globalmente
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  })),
}));

// Configuração do banco de dados para testes
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:', // Usar banco em memória para testes
  entities: [WeatherLog],
  synchronize: true,
  logging: false, // Desabilitar logs durante os testes
});

// Setup global dos testes
beforeAll(async () => {
  // Inicializar o banco de dados de teste
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
  
  // Configurar o WeatherService para usar o testDataSource
  WeatherService.setDataSource(testDataSource);
});

afterAll(async () => {
  // Fechar conexão do banco de dados
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

// Limpar dados entre os testes
beforeEach(async () => {
  // Limpar todas as tabelas
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
});

// Mock do console.log para testes mais limpos
const originalConsole = global.console;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restaurar console após os testes se necessário
afterAll(() => {
  global.console = originalConsole;
});
