import 'reflect-metadata';

// Simple test case replicating the decorator pattern
const ROUTES_KEY = Symbol.for('routes');

function TestRoute(method: string, path: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // For static methods, target is already the constructor
        const targetConstructor = target;
        
        if (!Reflect.hasMetadata(ROUTES_KEY, targetConstructor)) {
            Reflect.defineMetadata(ROUTES_KEY, [], targetConstructor);
        }

        const routes = Reflect.getMetadata(ROUTES_KEY, targetConstructor) || [];
        routes.push({ method, path, propertyKey });
        Reflect.defineMetadata(ROUTES_KEY, routes, targetConstructor);
        
        console.log(`TEST: Route registered: ${method} ${path} -> ${propertyKey}`);
    };
}

function TestController(basePath: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        Reflect.defineMetadata('basePath', basePath, constructor);
        console.log(`TEST: Controller registered with base path: ${basePath}`);
        return constructor;
    };
}

@TestController('/api/v1')
class TestControllerClass {
    @TestRoute('get', 'health')
    static healthCheck() {
        return 'OK';
    }
    
    @TestRoute('get', 'test/:id')
    static getTest() {
        return 'Test';
    }
}

describe('Simple Decorator Test', () => {
  it('should store and retrieve metadata correctly', () => {
    console.log('=== SIMPLE DECORATOR TEST ===');
    
    const basePath = Reflect.getMetadata('basePath', TestControllerClass);
    const routes = Reflect.getMetadata(ROUTES_KEY, TestControllerClass);
    
    console.log(`Base path: "${basePath}"`);
    console.log(`Routes:`, routes);
    console.log(`Routes length: ${routes ? routes.length : 'undefined'}`);
    
    expect(basePath).toBe('/api/v1');
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBe(2);
  });
});
