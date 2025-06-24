import { WeatherLog } from '../../src/entities/WeatherLog';

describe('WeatherLog Entity', () => {
  describe('constructor', () => {
    it('should create instance with minimal data', () => {
      const log = new WeatherLog();
      expect(log).toBeInstanceOf(WeatherLog);
      expect(log.id).toBeUndefined();
      expect(log.city).toBeUndefined();
      expect(log.temperature).toBeUndefined();
      expect(log.description).toBeUndefined();
      expect(log.humidity).toBeUndefined();
      expect(log.windSpeed).toBeUndefined();
      expect(log.windDirection).toBeUndefined();
      expect(log.pressure).toBeUndefined();
      expect(log.timestamp).toBeUndefined();
    });

    it('should create instance with all data', () => {
      const timestamp = new Date();
      const log = new WeatherLog();
      log.city = 'São Paulo';
      log.temperature = 25.5;
      log.description = 'Clear sky';
      log.humidity = 65;
      log.windSpeed = 3.5;
      log.windDirection = 315; // NW is 315 degrees
      log.pressure = 1013;
      log.timestamp = timestamp;

      expect(log.city).toBe('São Paulo');
      expect(log.temperature).toBe(25.5);
      expect(log.description).toBe('Clear sky');
      expect(log.humidity).toBe(65);
      expect(log.windSpeed).toBe(3.5);
      expect(log.windDirection).toBe(315);
      expect(log.pressure).toBe(1013);
      expect(log.timestamp).toBe(timestamp);
    });
  });

  describe('BeforeInsert hook', () => {
    it('should call beforeInsert hook when method exists', () => {
      const log = new WeatherLog();
      log.city = 'Test City';
      log.temperature = 20;
      log.description = 'Test';
      log.timestamp = new Date();

      // Simulate beforeInsert by calling the method directly
      const beforeInsert = (log as any).beforeInsert;
      if (beforeInsert) {
        expect(() => beforeInsert.call(log)).not.toThrow();
      }

      // The hook doesn't set timestamp, just logs data
      expect(log.city).toBe('Test City');
      expect(log.temperature).toBe(20);
      expect(log.description).toBe('Test');
    });
  });

  describe('static methods', () => {
    it('should create from API response data', () => {
      const apiData = {
        city: 'Rio de Janeiro',
        temperature: 28.0,
        description: 'Sunny',
        humidity: 70,
        windSpeed: 2.5,
        windDirection: 90, // E is 90 degrees
        pressure: 1015,
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const log = Object.assign(new WeatherLog(), apiData);
      
      expect(log.city).toBe('Rio de Janeiro');
      expect(log.temperature).toBe(28.0);
      expect(log.description).toBe('Sunny');
      expect(log.humidity).toBe(70);
      expect(log.windSpeed).toBe(2.5);
      expect(log.windDirection).toBe(90);
      expect(log.pressure).toBe(1015);
      expect(log.timestamp).toEqual(new Date('2024-01-01T12:00:00Z'));
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const log = new WeatherLog();
      log.id = 1;
      log.city = 'São Paulo';
      log.temperature = 25.5;
      log.description = 'Clear sky';
      log.humidity = 65;
      log.windSpeed = 3.5;
      log.windDirection = 315; // NW is 315 degrees
      log.pressure = 1013;
      log.timestamp = timestamp;

      const json = JSON.parse(JSON.stringify(log));

      expect(json).toEqual({
        id: 1,
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        humidity: 65,
        windSpeed: 3.5,
        windDirection: 315,
        pressure: 1013,
        timestamp: '2024-01-01T12:00:00.000Z'
      });
    });
  });

  describe('validation and constraints', () => {
    it('should handle null and undefined values', () => {
      const log = new WeatherLog();
      log.city = null as any;
      log.temperature = undefined as any;
      log.description = null as any;

      expect(log.city).toBeNull();
      expect(log.temperature).toBeUndefined();
      expect(log.description).toBeNull();
    });

    it('should handle edge case values', () => {
      const log = new WeatherLog();
      log.temperature = 0;
      log.humidity = 100;
      log.windSpeed = 0;
      log.pressure = 950;

      expect(log.temperature).toBe(0);
      expect(log.humidity).toBe(100);
      expect(log.windSpeed).toBe(0);
      expect(log.pressure).toBe(950);
    });
  });
});
