import { debugAPI as debugModels, logger } from "../config/logger";

/**
 * Weather DTO - Data Transfer Object for weather information
 */
export class WeatherDTO {
    public readonly id?: number;
    public readonly city: string;
    public readonly temperature: number;
    public readonly description: string;
    public readonly humidity?: number;
    public readonly windSpeed?: number;
    public readonly windDirection?: number;
    public readonly pressure?: number;
    public readonly timestamp: Date;
    public readonly conditions?: string; // Alias for description

    constructor(data: {
        id?: number;
        city: string;
        temperature: number;
        description: string;
        humidity?: number;
        windSpeed?: number;
        windDirection?: number;
        pressure?: number;
        timestamp: Date;
    }) {
        this.id = data.id;
        this.city = data.city;
        this.temperature = data.temperature;
        this.description = data.description;
        this.humidity = data.humidity;
        this.windSpeed = data.windSpeed;
        this.windDirection = data.windDirection;
        this.pressure = data.pressure;
        this.timestamp = data.timestamp;
        this.conditions = data.description; // Set alias

        debugModels('WeatherDTO created', {
            city: this.city,
            temperature: this.temperature,
            description: this.description
        });
    }

    /**
     * Convert DTO to JSON representation
     */
    toJSON(): any {
        return {
            id: this.id,
            city: this.city,
            temperature: this.temperature,
            description: this.description,
            conditions: this.conditions,
            humidity: this.humidity,
            windSpeed: this.windSpeed,
            windDirection: this.windDirection,
            pressure: this.pressure,
            timestamp: this.timestamp.toISOString()
        };
    }

    /**
     * Get a formatted string representation
     */
    toString(): string {
        return `Weather in ${this.city}: ${this.temperature}°C, ${this.description}`;
    }

    /**
     * Check if weather data has complete information
     */
    isComplete(): boolean {
        return !!(this.city && 
                 this.temperature !== undefined && 
                 this.description && 
                 this.timestamp);
    }

    /**
     * Create WeatherDTO from API response
     */
    static fromApiResponse(response: OpenWeatherApiResponse): WeatherDTO {
        return new WeatherDTO({
            city: response.name,
            temperature: response.main.temp,
            description: response.weather[0].description,
            humidity: response.main.humidity,
            windSpeed: response.wind?.speed,
            windDirection: response.wind?.deg,
            pressure: response.main.pressure,
            timestamp: new Date()
        });
    }
}

/**
 * Generic API Response wrapper
 */
export class ApiResponse<T = any> {
    public readonly success: boolean;
    public readonly message: string;
    public readonly data?: T;
    public readonly error?: string;
    public readonly timestamp: string;

    constructor(
        success: boolean, 
        message: string, 
        data?: T, 
        error?: string
    ) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
        this.timestamp = new Date().toISOString();

        debugModels('ApiResponse created', {
            success: this.success,
            message: this.message,
            hasData: !!this.data,
            hasError: !!this.error
        });
    }

    /**
     * Create success response
     */
    static success<T>(data: T, message: string = "Operation successful"): ApiResponse<T> {
        logger.debug('ApiResponse.success created', { message, hasData: !!data });
        return new ApiResponse(true, message, data);
    }

    /**
     * Create error response
     */
    static error(message: string, error?: string): ApiResponse {
        logger.debug('ApiResponse.error created', { message, error });
        return new ApiResponse(false, message, undefined, error);
    }
}

/**
 * OpenWeather API Response interfaces
 */
export interface OpenWeatherApiResponse {
    coord: {
        lon: number;
        lat: number;
    };
    weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
    }>;
    base: string;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    visibility: number;
    wind: {
        speed: number;
        deg: number;
    };
    clouds: {
        all: number;
    };
    dt: number;
    sys: {
        type: number;
        id: number;
        country: string;
        sunrise: number;
        sunset: number;
    };
    timezone: number;
    id: number;
    name: string;
    cod: number;
}

/**
 * Weather data interface for internal use
 */
export interface WeatherData {
    city: string;
    temperature: number;
    description: string;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    pressure?: number;
    timestamp: Date;
}

/**
 * Health check response interface
 */
export interface HealthCheck {
    message: string;
    version: string;
    timestamp: string;
    uptime: number;
    environment: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
    success: false;
    message: string;
    error: string;
    timestamp: string;
}
