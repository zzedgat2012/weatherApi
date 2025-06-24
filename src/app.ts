import "dotenv/config";
import express from "express";
import "reflect-metadata";
import { DatabaseManager } from "./config/data-source";
import { debugApp, logger } from "./config/logger";
import VSCodeDebugger from "./config/vscode-debugger";
import { WeatherController } from "./controllers/WeatherController";
import { LoggableClass, LogMethod } from "./decorators";

@LoggableClass
export class WeatherApp {
    private app: express.Application;
    private readonly port: number;
    private databaseManager: DatabaseManager;

    constructor(port: number = Number(process.env.PORT) || 3000) {
        this.app = express();
        this.port = port;
        this.databaseManager = DatabaseManager.getInstance();
        
        // Log environment configuration
        VSCodeDebugger.watch('WeatherApp.port', this.port, 'Server port');
        VSCodeDebugger.watch('WeatherApp.nodeEnv', process.env.NODE_ENV, 'Node environment');
        VSCodeDebugger.watch('WeatherApp.apiKeyConfigured', !!process.env.OPENWEATHER_API_KEY, 'API Key configured');
        
        this.setupMiddleware();
    }

    @LogMethod
    private setupMiddleware(): void {
        // Request logging middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            debugApp(`${req.method} ${req.path}`);
            logger.info('Request received', {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                debugApp(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
                logger.info('Request completed', {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`
                });
            });
            
            next();
        });

        this.app.use(express.json());
        this.app.use(WeatherController.getRouter());
    }

    @LogMethod
    async initialize(): Promise<void> {
        try {
            await this.databaseManager.initialize();
            debugApp('Database initialized, starting server...');
            logger.info('Database initialized successfully');
        } catch (error) {
            debugApp('DB init error:', error);
            logger.error('Database initialization failed', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    @LogMethod
    start(): void {
        this.app.listen(this.port, () => {
            debugApp(`Server running on port ${this.port}`);
            logger.info('Server started', { port: this.port, environment: process.env.NODE_ENV });
            console.log(`🌦️ Weather API Server running on port ${this.port}`);
        });
    }

    @LogMethod
    async startWithDatabase(): Promise<void> {
        try {
            await this.initialize();
            this.start();
        } catch (error) {
            console.error("❌ Failed to start server:", error);
            process.exit(1);
        }
    }

    @LogMethod
    async shutdown(): Promise<void> {
        try {
            await this.databaseManager.destroy();
            debugApp('Application shutdown completed');
            logger.info('Application shutdown completed');
        } catch (error) {
            debugApp('Error during shutdown:', error);
            logger.error('Error during shutdown', { 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }

    getApp(): express.Application {
        return this.app;
    }
}

// Initialize and start the application
const weatherApp = new WeatherApp();
weatherApp.startWithDatabase();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await weatherApp.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await weatherApp.shutdown();
    process.exit(0);
});
