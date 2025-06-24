import "reflect-metadata";
import { DataSource } from "typeorm";
import { LoggableClass, LogMethod } from "../decorators";
import { WeatherLog } from "../entities/WeatherLog";
import { debugDB, logger } from "./logger";

@LoggableClass
export class DatabaseManager {
    private static instance: DatabaseManager;
    private dataSource: DataSource;

    private constructor() {
        this.dataSource = new DataSource({
            type: "sqlite",
            database: "./database/weather.db",
            synchronize: true,
            logging: process.env.TYPEORM_LOGGING === 'true',
            entities: [WeatherLog],
            migrations: [],
            subscribers: [],
        });
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    @LogMethod
    public async initialize(): Promise<void> {
        try {
            await this.dataSource.initialize();
            debugDB('Database connection established successfully');
            logger.info('Database connection established', { database: 'weather.db' });
        } catch (error) {
            debugDB('Database connection failed:', error);
            logger.error('Database connection failed', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    @LogMethod
    public async destroy(): Promise<void> {
        try {
            await this.dataSource.destroy();
            debugDB('Database connection closed successfully');
            logger.info('Database connection closed');
        } catch (error) {
            debugDB('Error closing database connection:', error);
            logger.error('Error closing database connection', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    public getDataSource(): DataSource {
        return this.dataSource;
    }

    @LogMethod
    public isInitialized(): boolean {
        return this.dataSource.isInitialized;
    }
}

// Export singleton instance for backwards compatibility
export const AppDataSource = DatabaseManager.getInstance().getDataSource();
