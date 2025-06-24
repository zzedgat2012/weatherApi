import { ApiResponse, WeatherDTO } from '../../src/models/WeatherModels';

describe('Weather Models', () => {
  describe('WeatherDTO', () => {
    it('should create a WeatherDTO instance', () => {
      const data = {
        id: 1,
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        humidity: 60,
        windSpeed: 10.5,
        timestamp: new Date()
      };

      const weather = new WeatherDTO(data);

      expect(weather.city).toBe('São Paulo');
      expect(weather.temperature).toBe(25.5);
      expect(weather.description).toBe('Clear sky');
      expect(weather.humidity).toBe(60);
      expect(weather.windSpeed).toBe(10.5);
    });

    it('should convert to JSON format', () => {
      const data = {
        id: 1,
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        humidity: 60,
        windSpeed: 10.5,
        timestamp: new Date('2024-01-01T10:00:00Z')
      };

      const weather = new WeatherDTO(data);
      const json = weather.toJSON();

      expect(json).toEqual({
        id: 1,
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        conditions: 'Clear sky', // Alias para description
        humidity: 60,
        windSpeed: 10.5,
        windDirection: undefined,
        pressure: undefined,
        timestamp: '2024-01-01T10:00:00.000Z'
      });
    });

    it('should return formatted string with toString', () => {
      const weather = new WeatherDTO({
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        timestamp: new Date()
      });

      const result = weather.toString();
      expect(result).toBe('Weather in São Paulo: 25.5°C, Clear sky');
    });

    it('should check if weather data is complete', () => {
      const completeWeather = new WeatherDTO({
        city: 'São Paulo',
        temperature: 25.5,
        description: 'Clear sky',
        timestamp: new Date()
      });

      const incompleteWeather = new WeatherDTO({
        city: '',
        temperature: 25.5,
        description: 'Clear sky',
        timestamp: new Date()
      });

      const incompleteWeatherNoTemp = new WeatherDTO({
        city: 'São Paulo',
        temperature: undefined as any,
        description: 'Clear sky',
        timestamp: new Date()
      });

      const incompleteWeatherNoDesc = new WeatherDTO({
        city: 'São Paulo',
        temperature: 25.5,
        description: '',
        timestamp: new Date()
      });

      expect(completeWeather.isComplete()).toBe(true);
      expect(incompleteWeather.isComplete()).toBe(false);
      expect(incompleteWeatherNoTemp.isComplete()).toBe(false);
      expect(incompleteWeatherNoDesc.isComplete()).toBe(false);
    });

    it('should create WeatherDTO from API response', () => {
      const apiResponse = {
        coord: { lon: -46.6388, lat: -23.5489 },
        weather: [
          {
            id: 800,
            main: 'Clear',
            description: 'clear sky',
            icon: '01d'
          }
        ],
        base: 'stations',
        main: {
          temp: 25.5,
          feels_like: 28.0,
          temp_min: 24.0,
          temp_max: 27.0,
          pressure: 1013.25,
          humidity: 65
        },
        visibility: 10000,
        wind: {
          speed: 3.5,
          deg: 180
        },
        clouds: { all: 0 },
        dt: 1641024000,
        sys: {
          type: 1,
          id: 8393,
          country: 'BR',
          sunrise: 1641024000,
          sunset: 1641067200
        },
        timezone: -10800,
        id: 3448439,
        name: 'Test City',
        cod: 200
      };

      const dto = WeatherDTO.fromApiResponse(apiResponse);

      expect(dto.city).toBe('Test City');
      expect(dto.temperature).toBe(25.5);
      expect(dto.description).toBe('clear sky');
      expect(dto.humidity).toBe(65);
      expect(dto.windSpeed).toBe(3.5);
      expect(dto.windDirection).toBe(180);
      expect(dto.pressure).toBe(1013.25);
    });
  });

  describe('ApiResponse', () => {
    it('should create a success response', () => {
      const data = { message: 'Success' };
      const response = ApiResponse.success(data, 'Operation successful');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Operation successful');
      expect(response.timestamp).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it('should create an error response', () => {
      const response = ApiResponse.error('Something went wrong', 'Error details');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Error details');
      expect(response.message).toBe('Something went wrong');
      expect(response.timestamp).toBeDefined();
      expect(response.data).toBeUndefined();
    });

    it('should create error response without details', () => {
      const response = ApiResponse.error('Something went wrong');

      expect(response.success).toBe(false);
      expect(response.message).toBe('Something went wrong');
      expect(response.timestamp).toBeDefined();
      expect(response.error).toBeUndefined();
      expect(response.data).toBeUndefined();
    });

  describe('Additional edge cases', () => {
    it('should handle undefined data in success response', () => {
      const response = ApiResponse.success(undefined, 'No data found');
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should handle null data in success response', () => {
      const response = ApiResponse.success(null, 'No data found');
      expect(response.success).toBe(true);
      expect(response.data).toBe(null);
    });

    it('should handle empty string data', () => {
      const response = ApiResponse.success('', 'Empty string data');
      expect(response.success).toBe(true);
      expect(response.data).toBe('');
    });

    it('should handle zero as valid data', () => {
      const response = ApiResponse.success(0, 'Zero value');
      expect(response.success).toBe(true);
      expect(response.data).toBe(0);
    });

    it('should handle false as valid data', () => {
      const response = ApiResponse.success(false, 'Boolean false');
      expect(response.success).toBe(true);
      expect(response.data).toBe(false);
    });

    it('should handle array data', () => {
      const response = ApiResponse.success([1, 2, 3], 'Array data');
      expect(response.success).toBe(true);
      expect(response.data).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const response = ApiResponse.success([], 'Empty array');
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });

  describe('ApiResponse constructor edge cases', () => {
    it('should handle no error parameter', () => {
      const response = new ApiResponse(false, 'Error occurred');
      expect(response.success).toBe(false);
      expect(response.error).toBeUndefined();
    });

    it('should handle empty error string', () => {
      const response = new ApiResponse(false, 'Error occurred', undefined, '');
      expect(response.success).toBe(false);
      expect(response.error).toBe('');
    });

    it('should handle whitespace-only error', () => {
      const response = new ApiResponse(false, 'Error occurred', undefined, '   ');
      expect(response.success).toBe(false);
      expect(response.error).toBe('   ');
    });
  });
  });
});
