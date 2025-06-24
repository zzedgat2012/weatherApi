import axios from 'axios';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { WeatherLog } from '../../src/entities/WeatherLog';
import { WeatherDTO } from '../../src/models/WeatherModels';
import { WeatherService } from '../../src/services/WeatherService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock repository factory
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findBy: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
  findByIds: jest.fn(),
  clear: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  findOneBy: jest.fn(),
  findOneByOrFail: jest.fn(),
  findOneOrFail: jest.fn(),
  countBy: jest.fn(),
  exists: jest.fn(),
  existsBy: jest.fn(),
  sum: jest.fn(),
  average: jest.fn(),
  minimum: jest.fn(),
  maximum: jest.fn(),
  query: jest.fn(),
  extend: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  merge: jest.fn(),
  preload: jest.fn(),
  hasId: jest.fn(),
  getId: jest.fn(),
  createQueryBuilder: jest.fn(),
  updateAll: jest.fn(),
  deleteAll: jest.fn(),
  exist: jest.fn(),
  findAndCountBy: jest.fn(),
  manager: {} as any,
  target: WeatherLog,
  metadata: {} as any,
  queryRunner: undefined
} as unknown as jest.Mocked<Repository<WeatherLog>>);

// Mock the data source
jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('WeatherService', () => {
  let mockRepository: jest.Mocked<Repository<WeatherLog>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = createMockRepository();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    // Set the data source for testing
    WeatherService.setDataSource(AppDataSource);
  });

  describe('setDataSource', () => {
    it('should set the data source', () => {
      const mockDataSource = {} as any;
      WeatherService.setDataSource(mockDataSource);
      expect(WeatherService.getDataSource()).toBe(mockDataSource);
    });
  });

  describe('getDataSource', () => {
    it('should return the current data source', () => {
      const dataSource = WeatherService.getDataSource();
      expect(dataSource).toBe(AppDataSource);
    });
  });

  describe('getWeather', () => {
    const mockApiResponse = {
      main: { temp: 25.5, humidity: 65 },
      weather: [{ description: 'clear sky' }],
      wind: { speed: 3.5 },
      name: 'Test City'
    };

    beforeEach(() => {
      // Mock successful API response
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });
    });

    it('should fetch weather successfully', async () => {
      const weather = await WeatherService.getWeather('Test City');
      
      expect(weather).toBeInstanceOf(WeatherDTO);
      expect(weather.city).toBe('Test City');
      expect(weather.temperature).toBe(25.5);
      expect(weather.description).toBe('clear sky');
    });

    it('should throw error for empty city name', async () => {
      await expect(WeatherService.getWeather('')).rejects.toThrow('City name is required');
      await expect(WeatherService.getWeather('   ')).rejects.toThrow('City name is required');
    });

    it('should throw error for missing API key', async () => {
      const originalApiKey = (WeatherService as any).API_KEY;
      (WeatherService as any).API_KEY = '';
      
      await expect(WeatherService.getWeather('Test City')).rejects.toThrow('OpenWeather API key is not configured');
      
      // Restore API key
      (WeatherService as any).API_KEY = originalApiKey;
    });

    it('should handle API errors correctly', async () => {
      // Test 404 error
      mockedAxios.get.mockRejectedValue({
        response: { status: 404, data: { message: 'city not found' } }
      });

      await expect(WeatherService.getWeather('NonExistentCity')).rejects.toThrow("City 'NonExistentCity' not found");
    });

    it('should handle 401 error correctly', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, data: { message: 'Invalid API key' } }
      });

      await expect(WeatherService.getWeather('AnyCity')).rejects.toThrow('Invalid API key');
    });

    it('should handle rate limit error correctly', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 429, data: { message: 'rate limit exceeded' } }
      });

      await expect(WeatherService.getWeather('AnyCity')).rejects.toThrow('Weather API error: rate limit exceeded');
    });

    it('should handle network error correctly', async () => {
      mockedAxios.get.mockRejectedValue({
        request: {}
      });

      await expect(WeatherService.getWeather('InvalidCity')).rejects.toThrow('Unable to reach weather service');
    });

    it('should handle request setup error correctly', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(WeatherService.getWeather('InvalidCity')).rejects.toThrow('Weather service error: Network Error');
    });
  });

  describe('saveWeatherLog', () => {
    it('should save weather log successfully', async () => {
      const weatherDTO = new WeatherDTO({
        city: 'Test City',
        temperature: 25.5,
        description: 'clear sky',
        timestamp: new Date()
      });

      const mockLog = { id: 1, city: 'Test City', temperature: 25.5 };
      mockRepository.create.mockReturnValue(mockLog as any);
      mockRepository.save.mockResolvedValue(mockLog as any);

      await WeatherService.saveWeatherLog(weatherDTO);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getWeatherHistory', () => {
    it('should fetch weather history successfully', async () => {
      const mockLogs = [
        { id: 1, city: 'São Paulo', temperature: 25, description: 'Sunny', timestamp: new Date('2024-01-01') },
        { id: 2, city: 'São Paulo', temperature: 22, description: 'Cloudy', timestamp: new Date('2024-01-02') }
      ];

      mockRepository.find.mockResolvedValue(mockLogs as any);

      const result = await WeatherService.getWeatherHistory('São Paulo', 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(WeatherDTO);
      expect(result[0].city).toBe('São Paulo');
      expect(result[0].temperature).toBe(25);
    });

    it('should return empty array for city with no history', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await WeatherService.getWeatherHistory('Unknown City', 10);

      expect(result).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const result = await WeatherService.getWeatherHistory('São Paulo', 2);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { city: 'São Paulo' },
        order: { timestamp: 'DESC' },
        take: 2
      });
    });

    it('should use default limit of 10', async () => {
      await WeatherService.getWeatherHistory('AnyCity');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { city: 'AnyCity' },
        order: { timestamp: 'DESC' },
        take: 10
      });
    });
  });

  describe('deleteWeatherHistory', () => {
    it('should delete weather history and return count', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 5 } as any);

      const deletedCount = await WeatherService.deleteWeatherHistory('São Paulo');

      expect(deletedCount).toBe(5);
      expect(mockRepository.delete).toHaveBeenCalledWith({ city: 'São Paulo' });
    });

    it('should return 0 when no records are deleted', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const deletedCount = await WeatherService.deleteWeatherHistory('NonexistentCity');

      expect(deletedCount).toBe(0);
    });

    it('should handle undefined affected count', async () => {
      mockRepository.delete.mockResolvedValue({ affected: undefined } as any);

      const deletedCount = await WeatherService.deleteWeatherHistory('SomeCity');

      expect(deletedCount).toBe(0);
    });
  });
});
