import express from 'express';
import 'reflect-metadata';
import request from 'supertest';
import { WeatherController } from '../src/controllers/WeatherController';
import { RouteRegistry } from '../src/decorators/routeDecorators';

describe('Route Debug Tests', () => {
  it('should register routes correctly', async () => {
    // Test route metadata
    const routes = RouteRegistry.getRoutes(WeatherController);
    console.log('Routes array:', routes);
    console.log('Routes length:', routes.length);
    
    // Check if metadata is defined
    const hasRoutesMetadata = Reflect.hasMetadata('Symbol(routes)', WeatherController);
    console.log('Has routes metadata:', hasRoutesMetadata);
    
    const allKeys = Reflect.getMetadataKeys(WeatherController);
    console.log('All metadata keys:', allKeys);
    
    expect(routes.length).toBeGreaterThan(0);
    
    const basePath = RouteRegistry.getBasePath(WeatherController);
    expect(basePath).toBe('/api/v1');
    
    // Test router creation
    const router = RouteRegistry.createRouter(WeatherController);
    expect(router.stack.length).toBeGreaterThan(0);
    
    // Create a simple express app to test
    const app = express();
    app.use('/', router);
    
    // Test the health endpoint directly
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
  });
});
