import "reflect-metadata";
import { DataSource } from "typeorm";
import { WeatherLog } from "../entities/WeatherLog";
import { debugDB, logger } from "./logger";

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

    /**
     * Get singleton instance of DatabaseManager
     */
    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    /**
     * Initialize database connection
     */
    async initialize(): Promise<DataSource> {
        if (!this.dataSource.isInitialized) {
            try {
                debugDB('Initializing database connection...');
                logger.info('Database initialization started');
                
                await this.dataSource.initialize();
                
                debugDB('Database connection initialized successfully');
                logger.info('Database connection established', {
                    type: this.dataSource.options.type,
                    database: this.dataSource.options.database
                });
                
                return this.dataSource;
            } catch (error) {
                const err = error as Error;
                debugDB('Database initialization failed:', err);
                logger.error('Database initialization failed', {
                    error: err.message,
                    stack: err.stack
                });
                throw new Error(`Database initialization failed: ${err.message}`);
            }
        }
        
        debugDB('Database already initialized, returning existing connection');
        return this.dataSource;
    }

    /**
     * Get the DataSource instance
     */
    getDataSource(): DataSource {
        if (!this.dataSource.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.dataSource;
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        if (this.dataSource.isInitialized) {
            debugDB('Closing database connection...');
            logger.info('Closing database connection');
            
            await this.dataSource.destroy();
            
            debugDB('Database connection closed');
            logger.info('Database connection closed');
        }
    }
}

// Create and export the AppDataSource instance
const dbManager = DatabaseManager.getInstance();

// Initialize database on module load
export const initializeDatabase = async (): Promise<DataSource> => {
    return await dbManager.initialize();
};

// Export AppDataSource that can be used by repositories
export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "./database/weather.db",
    synchronize: true,
    logging: process.env.TYPEORM_LOGGING === 'true',
    entities: [WeatherLog],
    migrations: [],
    subscribers: [],
});

// Legacy export for backward compatibility
export const dataSource = AppDataSource;
