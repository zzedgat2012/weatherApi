import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { logger } from "../config/logger";
// Import controller FIRST to ensure decorators are applied
import { WeatherController } from "../controllers/WeatherController";
import { RouteRegistry } from "../decorators/routeDecorators";

/**
 * ApiRoutes - Clean route configuration using @Route decorators
 * 
 * This class automatically discovers and registers routes from decorated controllers
 * using our custom @Route(method, path) decorator system.
 */
export class ApiRoutes {
    private static router = Router();

    static getRouter(): Router {
        // Always call setupRoutes when getRouter is called
        ApiRoutes.setupRoutes();
        return ApiRoutes.router;
    }

    private static setupRoutes(): void {
        logger.info('🔧 Setting up routes using @Route decorators...');
        
        // Setup Swagger UI documentation route
        ApiRoutes.setupSwaggerUI();
        
        // Register all decorated controller routes
        ApiRoutes.registerControllerRoutes();
        
        logger.info('✅ All routes configured successfully using decorators');
    }

    /**
     * Setup Swagger UI documentation
     */
    private static setupSwaggerUI(): void {
        try {
            const { swaggerSpec } = require('../config/swagger');
            
            // Swagger UI static files middleware
            ApiRoutes.router.use('/api/v1/docs', swaggerUi.serve);
            
            // Swagger UI page with custom styling
            ApiRoutes.router.get('/api/v1/docs', swaggerUi.setup(swaggerSpec, {
                customCss: `
                    .swagger-ui .topbar { display: none }
                    .swagger-ui .info { margin: 20px 0; }
                    .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; }
                `,
                customSiteTitle: "Weather API Documentation",
                customfavIcon: "/favicon.ico",
                swaggerOptions: {
                    docExpansion: 'list',
                    filter: true,
                    showRequestHeaders: false
                }
            }));
            
            logger.info('📚 Swagger UI configured at /api/v1/docs');
        } catch (error) {
            logger.error('❌ Failed to setup Swagger UI:', error);
        }
    }

    /**
     * Register all routes from decorated controllers
     */
    private static registerControllerRoutes(): void {
        // Array of all controllers to register
        const controllers = [WeatherController];
        
        controllers.forEach(controllerClass => {
            try {
                const controllerRouter = RouteRegistry.createRouter(controllerClass);
                ApiRoutes.router.use('/', controllerRouter);
                
                const basePath = RouteRegistry.getBasePath(controllerClass);
                const routes = RouteRegistry.getRoutes(controllerClass);
                
                logger.info(`✅ Controller registered: ${controllerClass.name}`, {
                    basePath,
                    routeCount: routes.length,
                    routes: routes.map(r => `${r.method.toUpperCase()} ${r.path}`)
                });
                
            } catch (error) {
                logger.error(`❌ Failed to register controller: ${controllerClass.name}`, {
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error; // Re-throw to prevent app from starting with broken routes
            }
        });
    }

    /**
     * Get route information for debugging
     */
    static getRouteInfo(): any {
        return {
            controllers: [WeatherController].map(controller => ({
                name: controller.name,
                basePath: RouteRegistry.getBasePath(controller),
                routes: RouteRegistry.getRoutes(controller)
            }))
        };
    }
}
