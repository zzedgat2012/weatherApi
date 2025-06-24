import { NextFunction, Request, Response, Router } from "express";
import { logger } from "../config/logger";

// Metadata keys for route decorators
const ROUTES_KEY = 'routes';
const MIDDLEWARES_KEY = 'middlewares';

// Route method types
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

// Route metadata interface
export interface RouteMetadata {
    method: HttpMethod;
    path: string;
    propertyKey: string;
    middlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

// Middleware metadata interface
export interface MiddlewareMetadata {
    propertyKey: string;
    middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

/**
 * Simple Route decorator - @Route('get', '/health')
 */
export function Route(method: HttpMethod, path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // For static methods, target is the constructor (class)
        const targetClass = target;
        
        // Ensure routes metadata exists
        if (!Reflect.hasMetadata(ROUTES_KEY, targetClass)) {
            Reflect.defineMetadata(ROUTES_KEY, [], targetClass);
        }

        // Get existing routes and add new route
        const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, targetClass) || [];
        routes.push({
            method,
            path,
            propertyKey,
            middlewares: Reflect.getMetadata(MIDDLEWARES_KEY, target, propertyKey) || []
        });

        // Store updated routes metadata
        Reflect.defineMetadata(ROUTES_KEY, routes, targetClass);

        logger.debug(`Route registered: ${method.toUpperCase()} ${path} -> ${propertyKey}`);
    };
}

/**
 * Route decorator factory - Creates HTTP method decorators (legacy support)
 */
function createRouteDecorator(method: HttpMethod) {
    return function (path: string) {
        return Route(method, path);
    };
}

/**
 * HTTP Method Decorators
 */
export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Delete = createRouteDecorator('delete');
export const Patch = createRouteDecorator('patch');

/**
 * Middleware decorator - Applies middleware to specific route
 */
export function UseMiddleware(...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(MIDDLEWARES_KEY, middlewares, target, propertyKey);
        
        logger.debug(`Middleware registered for ${propertyKey}: ${middlewares.length} middleware(s)`);
    };
}

/**
 * Controller decorator - Marks class as route controller and sets base path
 */
export function Controller(basePath: string = '') {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        logger.debug(`Controller registered with base path: ${basePath}`);
        
        // Store base path metadata
        Reflect.defineMetadata('basePath', basePath, constructor);
        
        return constructor;
    };
}

/**
 * Route registry utility - Builds Express router from decorated controller
 */
export class RouteRegistry {
    static createRouter(controllerClass: any): Router {
        const router = Router();
        const basePath = Reflect.getMetadata('basePath', controllerClass) || '';
        const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];

        logger.info(`Creating routes for controller with base path: ${basePath}`);
        
        routes.forEach(route => {
            // Normalize paths to avoid double slashes and ensure proper formatting
            let fullPath: string;
            
            // Ensure both basePath and route.path start properly
            const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
            const normalizedRoutePath = route.path.startsWith('/') ? route.path : `/${route.path}`;
            
            // Combine paths
            if (normalizedBasePath === '/') {
                fullPath = normalizedRoutePath;
            } else {
                fullPath = normalizedBasePath + normalizedRoutePath;
            }
            
            // Clean up multiple slashes and trailing slashes
            fullPath = fullPath.replace(/\/+/g, '/');
            if (fullPath !== '/' && fullPath.endsWith('/')) {
                fullPath = fullPath.slice(0, -1);
            }
            
            const handler = controllerClass[route.propertyKey];
            
            if (typeof handler !== 'function') {
                logger.error(`Handler ${route.propertyKey} is not a function`);
                return;
            }

            // Apply middlewares if any
            const middlewares = route.middlewares || [];
            
            try {
                // Register route with Express router
                router[route.method](fullPath, ...middlewares, handler.bind(controllerClass));
                
                logger.info(`Route registered: ${route.method.toUpperCase()} ${fullPath} -> ${route.propertyKey}`, {
                    middlewareCount: middlewares.length
                });
                
            } catch (error) {
                logger.error(`Failed to register route: ${route.method.toUpperCase()} ${fullPath}`, {
                    error: error instanceof Error ? error.message : String(error),
                    propertyKey: route.propertyKey,
                    fullPath,
                    basePath,
                    routePath: route.path
                });
                throw error; // Re-throw to stop execution on route registration errors
            }
        });

        return router;
    }

    /**
     * Get all routes metadata for a controller
     */
    static getRoutes(controllerClass: any): RouteMetadata[] {
        return Reflect.getMetadata(ROUTES_KEY, controllerClass) || [];
    }

    /**
     * Get base path for a controller
     */
    static getBasePath(controllerClass: any): string {
        return Reflect.getMetadata('basePath', controllerClass) || '';
    }
}

/**
 * Parameter validation decorator
 */
export function ValidateParam(paramName: string, validator: (value: any) => boolean, errorMessage?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const paramValue = req.params[paramName];
            
            if (!validator(paramValue)) {
                const error = errorMessage || `Invalid parameter: ${paramName}`;
                logger.warn(`Parameter validation failed: ${paramName}`, { value: paramValue });
                
                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    error,
                    timestamp: new Date().toISOString()
                });
            }
            
            return originalMethod.call(this, req, res, next);
        };
        
        logger.debug(`Parameter validation registered for ${propertyKey}: ${paramName}`);
    };
}

/**
 * Query validation decorator
 */
export function ValidateQuery(queryName: string, validator: (value: any) => boolean, errorMessage?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const queryValue = req.query[queryName];
            
            if (!validator(queryValue)) {
                const error = errorMessage || `Invalid query parameter: ${queryName}`;
                logger.warn(`Query validation failed: ${queryName}`, { value: queryValue });
                
                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    error,
                    timestamp: new Date().toISOString()
                });
            }
            
            return originalMethod.call(this, req, res, next);
        };
        
        logger.debug(`Query validation registered for ${propertyKey}: ${queryName}`);
    };
}

/**
 * Helper validators
 */
export const Validators = {
    isString: (value: any): boolean => typeof value === 'string' && value.length > 0,
    isNonEmptyString: (value: any): boolean => typeof value === 'string' && value.trim().length > 0,
    isNumber: (value: any): boolean => !isNaN(Number(value)),
    isEmail: (value: any): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (min: number) => (value: any): boolean => typeof value === 'string' && value.length >= min,
    maxLength: (max: number) => (value: any): boolean => typeof value === 'string' && value.length <= max
};
