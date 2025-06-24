import { Request, Response } from "express";
import { debugAPI, logger } from "../config/logger";
import {
  Controller,
  Route,
  UseMiddleware,
  ValidateParam,
  ValidateQuery,
  Validators
} from "../decorators/routeDecorators";
import { requestLoggerMiddleware } from "../middlewares/requestLogger";
import { ApiResponse } from "../models/WeatherModels";
import { WeatherService } from "../services/WeatherService";

/**
 * WeatherController - Handles HTTP requests for weather data
 * 
 * Following MVC pattern with route decorators:
 * - Controller: Handles HTTP requests/responses using decorators for clean routing
 * - No business logic in controller - delegated to WeatherService
 * - Returns consistent ApiResponse format
 * - Uses middleware decorators for validation and logging
 */
@Controller('/api/v1')
export class WeatherController {

    /**
     * @swagger
     * /api/v1/health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the health status of the Weather API
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: API is healthy
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/HealthCheck'
     *             example:
     *               success: true
     *               message: "API is healthy"
     *               data:
     *                 message: "Weather API is running"
     *                 version: "1.0.0"
     *                 timestamp: "2024-01-01T12:00:00.000Z"
     *                 uptime: 3600
     *                 environment: "development"
     *               timestamp: "2024-01-01T12:00:00.000Z"
     */
    @Route('get', 'health')
    @UseMiddleware(requestLoggerMiddleware)
    public static async healthCheck(req: Request, res: Response): Promise<void> {
        const healthData = {
            message: "Weather API is running",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        };
        
        logger.info('Health check requested', { healthData });
        res.json(ApiResponse.success(healthData, "API is healthy"));
    }

    /**
     * @swagger
     * /api/v1/weather/{city}:
     *   get:
     *     summary: Get weather data by city name (URL parameter)
     *     description: Retrieves current weather information for a specified city using URL parameter
     *     tags: [Weather]
     *     parameters:
     *       - in: path
     *         name: city
     *         required: true
     *         description: The name of the city to get weather data for
     *         schema:
     *           type: string
     *           example: "London"
     *     responses:
     *       200:
     *         description: Weather data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WeatherData'
     *             example:
     *               success: true
     *               message: "Weather data for London"
     *               data:
     *                 city: "London"
     *                 temperature: 15.5
     *                 description: "Partly cloudy"
     *                 humidity: 65
     *                 windSpeed: 3.2
     *                 windDirection: 180
     *                 pressure: 1013.25
     *                 timestamp: "2024-01-01T12:00:00.000Z"
     *               timestamp: "2024-01-01T12:00:00.000Z"
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    @Route('get', 'weather/:city')
    @UseMiddleware(requestLoggerMiddleware)
    @ValidateParam('city', Validators.isNonEmptyString, 'City parameter must be a non-empty string')
    public static async getWeatherByCity(req: Request, res: Response): Promise<void> {
        const { city } = req.params;
        
        debugAPI(`Fetching weather for city: ${city}`);
        logger.info('Weather request received', { city, method: 'URL parameter' });
        
        try {
            const weather = await WeatherService.getWeather(city);
            debugAPI(`Weather data retrieved successfully for ${city}`);
            logger.info('Weather data retrieved successfully', { 
                city, 
                temperature: weather.temperature,
                conditions: weather.conditions 
            });
            
            const response = ApiResponse.success(weather.toJSON(), `Weather data for ${city}`);
            res.json(response);
        } catch (err) {
            const error = err as Error;
            debugAPI(`Error fetching weather for ${city}:`, error.message);
            logger.error('Weather fetch failed', { 
                city, 
                error: error.message,
                stack: error.stack 
            });
            
            const errorResponse = ApiResponse.error("Failed to fetch weather data", error.message);
            res.status(500).json(errorResponse);
        }
    }

    /**
     * @swagger
     * /api/v1/weather:
     *   get:
     *     summary: Get weather data by city name (query parameter)
     *     description: Retrieves current weather information for a specified city using query parameter
     *     tags: [Weather]
     *     parameters:
     *       - in: query
     *         name: city
     *         required: true
     *         description: The name of the city to get weather data for
     *         schema:
     *           type: string
     *           example: "London"
     *     responses:
     *       200:
     *         description: Weather data retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/WeatherData'
     *             example:
     *               success: true
     *               message: "Weather data for London"
     *               data:
     *                 city: "London"
     *                 temperature: 15.5
     *                 description: "Partly cloudy"
     *                 humidity: 65
     *                 windSpeed: 3.2
     *                 windDirection: 180
     *                 pressure: 1013.25
     *                 timestamp: "2024-01-01T12:00:00.000Z"
     *               timestamp: "2024-01-01T12:00:00.000Z"
     *       400:
     *         description: Missing or invalid city parameter
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *             example:
     *               success: false
     *               message: "Missing city parameter"
     *               error: "Please provide a city name as query parameter (?city=London)"
     *               timestamp: "2024-01-01T12:00:00.000Z"
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    @Route('get', 'weather')
    @UseMiddleware(requestLoggerMiddleware)
    @ValidateQuery('city', Validators.isNonEmptyString, 'Please provide a city name as query parameter (?city=London)')
    public static async getWeatherByQuery(req: Request, res: Response): Promise<void> {
        const { city } = req.query as { city: string }; // Type assertion safe due to validation decorator
        
        debugAPI(`Fetching weather for city via query: ${city}`);
        logger.info('Weather request received', { city, method: 'query parameter' });
        
        try {
            const weather = await WeatherService.getWeather(city);
            debugAPI(`Weather data retrieved successfully for ${city}`);
            logger.info('Weather data retrieved successfully', { 
                city, 
                temperature: weather.temperature,
                conditions: weather.conditions 
            });
            
            const response = ApiResponse.success(weather.toJSON(), `Weather data for ${city}`);
            res.json(response);
        } catch (err) {
            const error = err as Error;
            debugAPI(`Error fetching weather for ${city}:`, error.message);
            logger.error('Weather fetch failed', { 
                city, 
                error: error.message,
                stack: error.stack 
            });
            
            const errorResponse = ApiResponse.error("Failed to fetch weather data", error.message);
            res.status(500).json(errorResponse);
        }
    }

    /**
     * @swagger
     * /api/v1/weather/{city}/history:
     *   get:
     *     summary: Get weather history for a city
     *     description: Retrieves historical weather data for a specified city from database
     *     tags: [Weather]
     *     parameters:
     *       - in: path
     *         name: city
     *         required: true
     *         description: The name of the city to get weather history for
     *         schema:
     *           type: string
     *           example: "London"
     *       - in: query
     *         name: limit
     *         required: false
     *         description: Maximum number of records to return (default 10)
     *         schema:
     *           type: integer
     *           example: 5
     *     responses:
     *       200:
     *         description: Weather history retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/WeatherData'
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    @Route('get', 'weather/:city/history')
    @UseMiddleware(requestLoggerMiddleware)
    @ValidateParam('city', Validators.isNonEmptyString, 'City parameter must be a non-empty string')
    public static async getWeatherHistory(req: Request, res: Response): Promise<void> {
        const { city } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;
        
        debugAPI(`Fetching weather history for city: ${city}, limit: ${limit}`);
        logger.info('Weather history request received', { city, limit });
        
        try {
            const history = await WeatherService.getWeatherHistory(city, limit);
            debugAPI(`Weather history retrieved successfully for ${city}: ${history.length} records`);
            logger.info('Weather history retrieved successfully', { 
                city, 
                recordCount: history.length,
                requestedLimit: limit 
            });
            
            const response = ApiResponse.success(
                history.map((dto: any) => dto.toJSON()), 
                `Weather history for ${city} (${history.length} records)`
            );
            res.json(response);
        } catch (err) {
            const error = err as Error;
            debugAPI(`Error fetching weather history for ${city}:`, error.message);
            logger.error('Weather history fetch failed', { 
                city, 
                limit,
                error: error.message,
                stack: error.stack 
            });
            
            const errorResponse = ApiResponse.error("Failed to fetch weather history", error.message);
            res.status(500).json(errorResponse);
        }
    }
}