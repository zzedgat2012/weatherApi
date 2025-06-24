import 'reflect-metadata';
import { WeatherApp } from '../src/app';
import { AppDataSource } from '../src/config/data-source';

// Mock the AppDataSource
jest.mock('../src/config/data-source', () => ({
    AppDataSource: {
        initialize: jest.fn(),
        destroy: jest.fn(),
        isInitialized: true
    }
}));

// Mock process.env
const originalEnv = process.env;

describe('WeatherApp', () => {
    let app: WeatherApp;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Reset environment
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Constructor', () => {
        it('should create WeatherApp with default port', () => {
            app = new WeatherApp();
            expect(app.getPort()).toBe(3000);
        });

        it('should create WeatherApp with custom port', () => {
            app = new WeatherApp(4000);
            expect(app.getPort()).toBe(4000);
        });

        it('should create WeatherApp with port from environment', () => {
            process.env.PORT = '5000';
            app = new WeatherApp();
            expect(app.getPort()).toBe(5000);
        });
    });

    describe('initialize', () => {
        beforeEach(() => {
            app = new WeatherApp(3001);
        });

        it('should initialize successfully', async () => {
            (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
            
            const expressApp = await app.initialize();
            
            expect(AppDataSource.initialize).toHaveBeenCalled();
            expect(expressApp).toBeDefined();
            expect(app.getApp()).toBe(expressApp);
        });

        it('should handle initialization error', async () => {
            const error = new Error('Database connection failed');
            (AppDataSource.initialize as jest.Mock).mockRejectedValue(error);
            
            await expect(app.initialize()).rejects.toThrow('Database connection failed');
        });
    });

    describe('initializeForTesting', () => {
        beforeEach(() => {
            app = new WeatherApp(3002);
        });

        it('should initialize successfully for testing', async () => {
            const expressApp = await app.initializeForTesting();
            
            expect(AppDataSource.initialize).not.toHaveBeenCalled();
            expect(expressApp).toBeDefined();
            expect(app.getApp()).toBe(expressApp);
        });

        it('should handle initialization error for testing', async () => {
            // Mock a middleware setup error by making express throw
            const originalSetupRoutes = (app as any).setupRoutes;
            (app as any).setupRoutes = jest.fn(() => {
                throw new Error('Routes setup failed');
            });
            
            await expect(app.initializeForTesting()).rejects.toThrow('Routes setup failed');
            
            // Restore original method
            (app as any).setupRoutes = originalSetupRoutes;
        });
    });

    describe('start', () => {
        let mockListen: jest.Mock;

        beforeEach(() => {
            app = new WeatherApp(3003);
            // Mock express app listen method
            mockListen = jest.fn((port, callback) => {
                // Simulate successful server start
                if (callback) callback();
                return { close: jest.fn() };
            });
            (app.getApp() as any).listen = mockListen;
        });

        it('should start server successfully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            await app.start();
            
            expect(mockListen).toHaveBeenCalledWith(3003, expect.any(Function));
            expect(consoleSpy).toHaveBeenCalledWith('🚀 Weather API Server is running on port 3003');
            expect(consoleSpy).toHaveBeenCalledWith('📚 API Documentation: http://localhost:3003/api/v1/docs');
            expect(consoleSpy).toHaveBeenCalledWith('💚 Health Check: http://localhost:3003/api/v1/health');
            
            consoleSpy.mockRestore();
        });

        it('should handle server start error', async () => {
            mockListen.mockImplementation(() => {
                throw new Error('Port already in use');
            });
            
            await expect(app.start()).rejects.toThrow('Port already in use');
        });
    });

    describe('shutdown', () => {
        beforeEach(() => {
            app = new WeatherApp(3004);
        });

        it('should shutdown successfully when database is initialized', async () => {
            (AppDataSource.isInitialized as any) = true;
            (AppDataSource.destroy as jest.Mock).mockResolvedValue(undefined);
            
            await app.shutdown();
            
            expect(AppDataSource.destroy).toHaveBeenCalled();
        });

        it('should shutdown successfully when database is not initialized', async () => {
            (AppDataSource.isInitialized as any) = false;
            
            await app.shutdown();
            
            expect(AppDataSource.destroy).not.toHaveBeenCalled();
        });

        it('should handle shutdown error', async () => {
            (AppDataSource.isInitialized as any) = true;
            const error = new Error('Database close failed');
            (AppDataSource.destroy as jest.Mock).mockRejectedValue(error);
            
            await expect(app.shutdown()).rejects.toThrow('Database close failed');
        });
    });

    describe('getApp and getPort', () => {
        beforeEach(() => {
            app = new WeatherApp(3005);
        });

        it('should return the Express app instance', () => {
            const expressApp = app.getApp();
            expect(expressApp).toBeDefined();
            expect(typeof expressApp.use).toBe('function');
        });

        it('should return the correct port', () => {
            expect(app.getPort()).toBe(3005);
        });
    });
});
