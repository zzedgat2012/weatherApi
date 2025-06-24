import 'reflect-metadata';
import { WeatherController } from '../src/controllers/WeatherController';

describe('Route Registration Debug', () => {
  it('should show route metadata', () => {
    console.log('=== DEBUGGING METADATA ACCESS ===');
    
    // Test all possible metadata keys
    const allKeys = Reflect.getMetadataKeys(WeatherController);
    console.log('All metadata keys:', allKeys);
    
    // Test specific symbol access
    const routesSymbol = Symbol.for('routes');
    const directRoutes = Reflect.getMetadata(routesSymbol, WeatherController);
    console.log(`Routes with Symbol.for('routes'):`, directRoutes);
    
    // Test string-based basePath
    const directBasePath = Reflect.getMetadata('basePath', WeatherController);
    console.log(`BasePath with string 'basePath':`, directBasePath);
    
    // Test various combinations
    const keys = ['routes', Symbol.for('routes'), 'basePath'];
    keys.forEach(key => {
      const value = Reflect.getMetadata(key, WeatherController);
      console.log(`Key ${key.toString()}:`, value);
    });
    
    // This should pass for now
    expect(true).toBe(true);
  });
});
