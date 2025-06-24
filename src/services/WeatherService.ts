import axios from "axios";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { debugService, logger } from "../config/logger";
import { WeatherLog } from "../entities/WeatherLog";
import { OpenWeatherApiResponse, WeatherDTO } from "../models/WeatherModels";

export class WeatherService {
	private static readonly API_KEY = process.env.OPENWEATHER_API_KEY;
	private static readonly BASE_URL = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
	private static dataSource: DataSource = AppDataSource;

	static {
		debugService(`WeatherService initialized with API key: ${!!this.API_KEY}`);
		debugService(`WeatherService BASE_URL: ${this.BASE_URL}`);
	}

	/**
	 * Set data source for testing
	 */
	static setDataSource(dataSource: DataSource): void {
		this.dataSource = dataSource;
	}

	/**
	 * Get current data source
	 */
	static getDataSource(): DataSource {
		return this.dataSource;
	}

	static async getWeather(city: string): Promise<WeatherDTO> {
		if (!city || city.trim().length === 0) {
			throw new Error('City name is required');
		}

		debugService(`Fetching weather for city: ${city}`);
		logger.info('Weather service request initiated', { city });

		if (!this.API_KEY) {
			const errorMsg = 'OpenWeather API key is not configured. Please set OPENWEATHER_API_KEY environment variable.';
			logger.error('API configuration error', { error: errorMsg });
			throw new Error(errorMsg);
		}

		try {
			const requestParams = {
				q: city,
				appid: this.API_KEY,
				units: 'metric'
			};

			debugService('Making API request with params:', requestParams);
			logger.info('Making external API request', { city, url: this.BASE_URL });

			const response = await axios.get<OpenWeatherApiResponse>(
				`${this.BASE_URL}/weather`,
				{ params: requestParams }
			);

			const { data } = response;
			debugService(`API response received for ${city}:`, data);
			logger.info('Weather API response received', { 
				city, 
				temperature: data.main.temp,
				description: data.weather[0].description 
			});

			// Transform API response to our DTO format
			const weather = new WeatherDTO({
				city: data.name,
				temperature: data.main.temp,
				description: data.weather[0].description,
				humidity: data.main.humidity,
				windSpeed: data.wind.speed,
				timestamp: new Date()
			});

			debugService(`Formatted weather data for ${city}:`, weather);
			logger.info('Weather data formatted successfully', { city, weatherId: weather.id });

			// Persist to database
			await this.saveWeatherLog(weather);

			return weather;

		} catch (error: any) {
			debugService(`Weather service error for ${city}:`, error);
			logger.error('Weather service error', { city, error: error.message });

			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				debugService('API Error Response:', {
					status: error.response.status,
					statusText: error.response.statusText,
					data: error.response.data
				});
				
				if (error.response.status === 404) {
					throw new Error(`City '${city}' not found. Please check the city name and try again.`);
				} else if (error.response.status === 401) {
					throw new Error('Invalid API key. Please check your OpenWeather API key configuration.');
				}
				throw new Error(`Weather API error: ${error.response.data?.message || error.response.statusText}`);
			} else if (error.request) {
				// The request was made but no response was received
				throw new Error('Unable to reach weather service. Please check your internet connection.');
			} else {
				// Something happened in setting up the request that triggered an Error
				throw new Error(`Weather service error: ${error.message}`);
			}
		}
	}

	static async saveWeatherLog(weather: WeatherDTO): Promise<void> {
		debugService('Saving weather data to database:', weather.toJSON());

		const repository = this.dataSource.getRepository(WeatherLog);
		const log = repository.create({
			city: weather.city,
			temperature: weather.temperature,
			description: weather.description,
			humidity: weather.humidity,
			windSpeed: weather.windSpeed,
			timestamp: weather.timestamp
		});

		debugService('Created weather log entity:', log);
		await repository.save(log);
		logger.info('Weather data saved to database', { city: weather.city, logId: log.id });
	}

	static async getWeatherHistory(city: string, limit: number = 10): Promise<WeatherDTO[]> {
		debugService(`Fetching weather history for ${city}, limit: ${limit}`);
		logger.info('Weather history request initiated', { city, limit });

		const repository = this.dataSource.getRepository(WeatherLog);
		const logs = await repository.find({
			where: { city },
			order: { timestamp: 'DESC' },
			take: limit
		});

		debugService(`Found ${logs.length} weather records for ${city}`);
		logger.info('Weather history retrieved', { city, recordCount: logs.length });

		return logs.map(log => new WeatherDTO({
			id: log.id,
			city: log.city,
			temperature: log.temperature,
			description: log.description,
			humidity: log.humidity,
			windSpeed: log.windSpeed,
			timestamp: log.timestamp
		}));
	}

	static async deleteWeatherHistory(city: string): Promise<number> {
		debugService(`Deleting weather history for ${city}`);
		logger.info('Weather history deletion request initiated', { city });

		const repository = AppDataSource.getRepository(WeatherLog);
		const result = await repository.delete({ city });

		const deletedCount = result.affected || 0;
		debugService(`Deleted ${deletedCount} weather records for ${city}`);
		logger.info('Weather history deleted', { city, deletedCount });

		return deletedCount;
	}
}
