import axios from "axios";
import { AppDataSource } from "../config/data-source";
import { debugService, logger } from "../config/logger";
import VSCodeDebugger from "../config/vscode-debugger";
import {
  isValidCity,
  LoggableClass,
  LogMethod,
  ValidateParams,
  VSCodeDebug
} from "../decorators";
import { WeatherLog } from "../entities/WeatherLog";

interface OpenWeatherResponse {
	name: string;
	main: {
		temp: number;
		humidity: number;
	};
	weather: {
		main: string;
		description: string;
	}[];
}

@LoggableClass
export class WeatherService {
	private static readonly API_KEY = process.env.OPENWEATHER_API_KEY;
	private static readonly BASE_URL = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";

	static {
		// Initialize watch properties for static members
		VSCodeDebugger.watch('WeatherService.API_KEY', !!this.API_KEY, 'API Key availability');
		VSCodeDebugger.watch('WeatherService.BASE_URL', this.BASE_URL, 'OpenWeather API Base URL');
	}

	@VSCodeDebug({ 
		watch: true, 
		breakpoint: false, 
		logArgs: true, 
		logResult: true,
		condition: (args) => args[0]?.length > 0 
	})
	@LogMethod
	@ValidateParams(isValidCity)
	static async getWeather(city: string) {
		// Add to VSCode watch
		VSCodeDebugger.watch('WeatherService.currentCity', city, 'Currently processing city');
		VSCodeDebugger.watch('WeatherService.API_KEY_status', !!this.API_KEY, 'API Key availability');
		
		debugService(`Getting weather data for: ${city}`);
		logger.info('Weather service called', { city });
		
		if (!WeatherService.API_KEY || WeatherService.API_KEY === 'demo_key_replace_with_real_key') {
			const errorMsg = !WeatherService.API_KEY 
				? "OpenWeather API key is not configured. Please set OPENWEATHER_API_KEY environment variable."
				: "Demo API key detected. Please replace with your real OpenWeather API key.";
			
			VSCodeDebugger.error('API Key configuration error', errorMsg);
			throw new Error(errorMsg);
		}

		try {
			// Watch API request data
			const requestParams = {
				q: city,
				appid: WeatherService.API_KEY,
				units: 'metric'
			};
			VSCodeDebugger.watch('WeatherService.apiRequest', requestParams, 'Current API request parameters');

			// Fetch weather data from OpenWeather API
			const response = await axios.get<OpenWeatherResponse>(
				`${WeatherService.BASE_URL}/weather`,
				{
					params: requestParams
				}
			);

			const data = response.data;
			VSCodeDebugger.watch('WeatherService.apiResponse', data, 'Raw API response data');
			
			// Format the weather data using private method
			const weather = WeatherService.formatWeatherData(data);

			debugService(`Weather data retrieved and formatted for ${city}`);
			logger.debug('Weather data retrieved', { city, weather });
			
			// Persist to DB using private method
			const logId = await WeatherService.persistWeatherData(weather);
			
			VSCodeDebugger.watch('WeatherService.formattedWeather', weather, 'Formatted weather data');
			
			debugService(`Weather data saved to database for ${city}`);
			logger.info('Weather data persisted', { city, id: logId });
			
			return weather;
		} catch (error) {
			VSCodeDebugger.error(`Weather service error for ${city}`, error);
			VSCodeDebugger.watch('WeatherService.lastError', error, 'Last error encountered');
			
			debugService(`Error in weather service for ${city}:`, error);
			logger.error('Weather service error', { 
				city, 
				error: error instanceof Error ? error.message : String(error) 
			});
			
			if (axios.isAxiosError(error)) {
				VSCodeDebugger.watch('WeatherService.axiosError', {
					status: error.response?.status,
					data: error.response?.data,
					message: error.message
				}, 'Axios error details');
				
				if (error.response?.status === 404) {
					throw new Error(`City "${city}" not found`);
				}
				if (error.response?.status === 401) {
					throw new Error("Invalid API key");
				}
				throw new Error(`Weather API error: ${error.response?.data?.message || error.message}`);
			}
			throw new Error(`Failed to fetch weather data: ${error}`);
		}
	}

	@VSCodeDebug({ watch: true, logResult: true })
	@LogMethod
	private static formatWeatherData(data: OpenWeatherResponse) {
		VSCodeDebugger.watch('WeatherService.rawData', data, 'Raw OpenWeather API data');
		
		const formattedData = {
			city: data.name,
			temperature: `${Math.round(data.main.temp)}°C`,
			humidity: `${data.main.humidity}%`,
			conditions: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)
		};
		
		VSCodeDebugger.watch('WeatherService.formattedData', formattedData, 'Formatted weather data');
		return formattedData;
	}

	@VSCodeDebug({ watch: true })
	@LogMethod
	private static async persistWeatherData(weather: any): Promise<number> {
		VSCodeDebugger.watch('WeatherService.weatherToPersist', weather, 'Weather data being persisted');
		
		const repo = AppDataSource.getRepository(WeatherLog);
		const log = repo.create(weather);
		
		VSCodeDebugger.watch('WeatherService.createdLog', log, 'Created weather log entity');
		
		const result = await repo.save(log);
		const savedLog = Array.isArray(result) ? result[0] : result;
		
		VSCodeDebugger.watch('WeatherService.savedLogId', savedLog.id, 'Saved weather log ID');
		
		return savedLog.id;
	}
}
