import "dotenv/config";
import express from "express";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AppDataSource } from "./config/data-source";
import { debugApp, logger } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { ApiRoutes } from "./routes/apiRoutes";

export async function createApp(dataSource?: DataSource): Promise<express.Application> {
    const weatherApp = new WeatherApp();
    
    // If a custom dataSource is provided (for testing), use it directly
    if (dataSource && dataSource.isInitialized) {
        // Initialize for testing without database setup
        return await weatherApp.initializeForTesting();
    }
    
    return await weatherApp.initialize();
}

export class WeatherApp {
    private app: express.Application;
    private readonly port: number;

    constructor(port: number = Number(process.env.PORT) || 3000) {
        this.app = express();
        this.port = port;
        
        debugApp('WeatherApp instance created', { port: this.port });
        logger.info('Weather API application initialized', { port: this.port });
    }

    /**
     * Initialize the application with all middlewares and routes
     */
    async initialize(): Promise<express.Application> {
        try {
            debugApp('Starting application initialization...');
            logger.info('Application initialization started');

            // Initialize database first
            await AppDataSource.initialize();
            debugApp('Database initialized successfully');

            // Setup middlewares
            this.setupMiddlewares();
            debugApp('Middlewares configured');

            // Setup routes
            this.setupRoutes();
            debugApp('Routes configured');

            // Setup error handling
            this.setupErrorHandling();
            debugApp('Error handling configured');

            debugApp('Application initialization completed');
            logger.info('Application initialization completed successfully');

            return this.app;
        } catch (error) {
            const err = error as Error;
            debugApp('Application initialization failed:', err);
            logger.error('Application initialization failed', {
                error: err.message,
                stack: err.stack
            });
            throw err;
        }
    }

    /**
     * Initialize the application for testing (without database initialization)
     */
    async initializeForTesting(): Promise<express.Application> {
        try {
            debugApp('Starting application initialization for testing...');
            logger.info('Application initialization started for testing');

            // Skip database initialization as it's already done in test setup
            
            // Setup middlewares
            this.setupMiddlewares();
            debugApp('Middlewares configured');

            // Setup routes
            this.setupRoutes();
            debugApp('Routes configured');

            // Setup error handling
            this.setupErrorHandling();
            debugApp('Error handling configured');

            debugApp('Application initialization completed for testing');
            logger.info('Application initialization completed successfully for testing');

            return this.app;
        } catch (error) {
            const err = error as Error;
            debugApp('Application initialization failed for testing:', err);
            logger.error('Application initialization failed for testing', {
                error: err.message,
                stack: err.stack
            });
            throw err;
        }
    }

    /**
     * Setup Express middlewares
     */
    private setupMiddlewares(): void {
        // Built-in middlewares
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        debugApp('Built-in middlewares configured');
        logger.debug('Express middlewares configured');
    }

    /**
     * Setup application routes
     */
    private setupRoutes(): void {
        // Setup API routes (includes Swagger UI)
        const router = ApiRoutes.getRouter();
        this.app.use('/', router);
        
        debugApp('API routes configured');
        logger.info('API routes registered successfully');
    }

    /**
     * Setup error handling middlewares
     */
    private setupErrorHandling(): void {
        // 404 handler must come before general error handler
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
        
        debugApp('Error handling middlewares configured');
        logger.debug('Error handling configured');
    }

    /**
     * Start the server
     */
    async start(): Promise<void> {
        try {
            debugApp('Starting server...');
            logger.info('Starting server', { port: this.port });

            this.app.listen(this.port, () => {
                debugApp(`Server started successfully on port ${this.port}`);
                logger.info('Server started successfully', {
                    port: this.port,
                    environment: process.env.NODE_ENV || 'development',
                    apiDocs: `http://localhost:${this.port}/api/v1/docs`,
                    healthCheck: `http://localhost:${this.port}/api/v1/health`
                });
                
                console.log(`🚀 Weather API Server is running on port ${this.port}`);
                console.log(`📚 API Documentation: http://localhost:${this.port}/api/v1/docs`);
                console.log(`💚 Health Check: http://localhost:${this.port}/api/v1/health`);
            });
        } catch (error) {
            const err = error as Error;
            debugApp('Server start failed:', err);
            logger.error('Server start failed', {
                error: err.message,
                stack: err.stack,
                port: this.port
            });
            throw err;
        }
    }

    /**
     * Get the Express application instance
     */
    getApp(): express.Application {
        return this.app;
    }

    /**
     * Get the server port
     */
    getPort(): number {
        return this.port;
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        try {
            debugApp('Shutting down application...');
            logger.info('Application shutdown initiated');

            // Close database connection
            if (AppDataSource.isInitialized) {
                await AppDataSource.destroy();
            }
            
            debugApp('Application shutdown completed');
            logger.info('Application shutdown completed');
        } catch (error) {
            const err = error as Error;
            debugApp('Application shutdown failed:', err);
            logger.error('Application shutdown failed', {
                error: err.message,
                stack: err.stack
            });
            throw err;
        }
    }
}
