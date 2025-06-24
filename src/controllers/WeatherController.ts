import { Request, Response, Router } from "express";
import { debugAPI, logger } from "../config/logger";
import { isValidString, LoggableClass, LogMethod, ValidateParams } from "../decorators";
import { WeatherService } from "../services/WeatherService";

@LoggableClass
export class WeatherController {
    private static router = Router();

    static getRouter(): Router {
        WeatherController.setupRoutes();
        return WeatherController.router;
    }

    private static setupRoutes(): void {
        // Health check endpoint
        WeatherController.router.get("/api/v1/health", WeatherController.healthCheck);
        
        // Weather endpoints
        WeatherController.router.get("/api/v1/weather/:city", WeatherController.getWeatherByCity);
        WeatherController.router.get("/api/v1/weather", WeatherController.getWeatherByQuery);
    }

    @LogMethod
    private static async healthCheck(req: Request, res: Response): Promise<void> {
        res.json({
            success: true,
            message: "Weather API is running",
            version: "1.0.0",
            timestamp: new Date().toISOString()
        });
    }

    @LogMethod
    @ValidateParams((req: Request) => isValidString(req.params.city))
    private static async getWeatherByCity(req: Request, res: Response): Promise<void> {
        const { city } = req.params;
        debugAPI(`Fetching weather for city: ${city}`);
        logger.info('Weather request received', { city });
        
        try {
            const weather = await WeatherService.getWeather(city);
            debugAPI(`Weather data retrieved successfully for ${city}`);
            logger.info('Weather data retrieved', { city, weather });
            res.json({
                success: true,
                data: weather,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            const error = err as Error;
            debugAPI(`Error fetching weather for ${city}:`, error.message);
            logger.error('Weather fetch failed', { 
                city, 
                error: error.message,
                stack: error.stack 
            });
            res.status(500).json({ 
                success: false,
                error: "Failed to fetch weather data",
                message: error.message,
                city,
                timestamp: new Date().toISOString()
            });
        }
    }

    @LogMethod
    private static async getWeatherByQuery(req: Request, res: Response): Promise<void> {
        const { city } = req.query;
        
        if (!city || typeof city !== 'string') {
            res.status(400).json({
                success: false,
                error: "Missing city parameter",
                message: "Please provide a city name as query parameter (?city=London)",
                timestamp: new Date().toISOString()
            });
            return;
        }

        debugAPI(`Fetching weather for city via query: ${city}`);
        logger.info('Weather request received via query', { city });
        
        try {
            const weather = await WeatherService.getWeather(city);
            debugAPI(`Weather data retrieved successfully for ${city}`);
            logger.info('Weather data retrieved', { city, weather });
            res.json({
                success: true,
                data: weather,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            const error = err as Error;
            debugAPI(`Error fetching weather for ${city}:`, error.message);
            logger.error('Weather fetch failed', { 
                city, 
                error: error.message,
                stack: error.stack 
            });
            res.status(500).json({ 
                success: false,
                error: "Failed to fetch weather data",
                message: error.message,
                city,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Export router instance for backwards compatibility
export { WeatherController as router };
