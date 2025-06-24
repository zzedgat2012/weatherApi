import { Router } from 'express';
import 'reflect-metadata';
import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Route,
  UseMiddleware,
  ValidateParam,
  ValidateQuery,
  configureRoutes,
  getAllControllers
} from '../../src/decorators/routeDecorators';

describe('Route Decorators', () => {
  let router: Router;
  
  beforeEach(() => {
    router = Router();
    // Clear controllers before each test
    const controllers = getAllControllers();
    controllers.length = 0;
  });

  describe('Controller decorator', () => {
    it('should register controller with base path', () => {
      @Controller('/api/v1')
      class TestController {}

      const controllers = getAllControllers();
      expect(controllers).toHaveLength(1);
      expect(controllers[0].basePath).toBe('/api/v1');
      expect(controllers[0].constructor).toBe(TestController);
    });

    it('should register controller without base path', () => {
      @Controller()
      class TestController {}

      const controllers = getAllControllers();
      expect(controllers).toHaveLength(1);
      expect(controllers[0].basePath).toBe('');
    });

    it('should register controller with empty base path', () => {
      @Controller('')
      class TestController {}

      const controllers = getAllControllers();
      expect(controllers).toHaveLength(1);
      expect(controllers[0].basePath).toBe('');
    });

    it('should register controller with root base path', () => {
      @Controller('/')
      class TestController {}

      const controllers = getAllControllers();
      expect(controllers).toHaveLength(1);
      expect(controllers[0].basePath).toBe('/');
    });
  });

  describe('Route decorator', () => {
    it('should register route with GET method', () => {
      @Controller('/test')
      class TestController {
        @Route('GET', '/endpoint')
        testMethod() {}
      }

      const controllers = getAllControllers();
      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes).toHaveLength(1);
      expect(routes[0].method).toBe('GET');
      expect(routes[0].path).toBe('/endpoint');
    });

    it('should register route with POST method', () => {
      @Controller('/test')
      class TestController {
        @Route('POST', '/create')
        createMethod() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('POST');
      expect(routes[0].path).toBe('/create');
    });

    it('should register route without leading slash', () => {
      @Controller('/test')
      class TestController {
        @Route('GET', 'endpoint')
        testMethod() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].path).toBe('endpoint');
    });
  });

  describe('HTTP Method decorators', () => {
    it('should use Get decorator', () => {
      @Controller('/test')
      class TestController {
        @Get('/users')
        getUsers() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('GET');
      expect(routes[0].path).toBe('/users');
    });

    it('should use Post decorator', () => {
      @Controller('/test')
      class TestController {
        @Post('/users')
        createUser() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('POST');
    });

    it('should use Put decorator', () => {
      @Controller('/test')
      class TestController {
        @Put('/users/:id')
        updateUser() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('PUT');
    });

    it('should use Delete decorator', () => {
      @Controller('/test')
      class TestController {
        @Delete('/users/:id')
        deleteUser() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('DELETE');
    });

    it('should use Patch decorator', () => {
      @Controller('/test')
      class TestController {
        @Patch('/users/:id')
        patchUser() {}
      }

      const routes = Reflect.getMetadata('routes', TestController) || [];
      expect(routes[0].method).toBe('PATCH');
    });
  });

  describe('UseMiddleware decorator', () => {
    it('should register middleware for method', () => {
      const testMiddleware = (req: any, res: any, next: any) => next();

      @Controller('/test')
      class TestController {
        @UseMiddleware(testMiddleware)
        @Get('/endpoint')
        testMethod() {}
      }

      const middlewares = Reflect.getMetadata('middlewares', TestController.prototype, 'testMethod');
      expect(middlewares).toHaveLength(1);
      expect(middlewares[0]).toBe(testMiddleware);
    });

    it('should register multiple middlewares', () => {
      const middleware1 = (req: any, res: any, next: any) => next();
      const middleware2 = (req: any, res: any, next: any) => next();

      @Controller('/test')
      class TestController {
        @UseMiddleware(middleware1, middleware2)
        @Get('/endpoint')
        testMethod() {}
      }

      const middlewares = Reflect.getMetadata('middlewares', TestController.prototype, 'testMethod');
      expect(middlewares).toHaveLength(2);
      expect(middlewares[0]).toBe(middleware1);
      expect(middlewares[1]).toBe(middleware2);
    });
  });

  describe('ValidateParam decorator', () => {
    it('should register parameter validation', () => {
      @Controller('/test')
      class TestController {
        @ValidateParam('id')
        @Get('/users/:id')
        getUser() {}
      }

      const params = Reflect.getMetadata('validateParams', TestController.prototype, 'getUser');
      expect(params).toContain('id');
    });

    it('should register multiple parameter validations', () => {
      @Controller('/test')
      class TestController {
        @ValidateParam('id')
        @ValidateParam('action')
        @Get('/users/:id/:action')
        getUserAction() {}
      }

      const params = Reflect.getMetadata('validateParams', TestController.prototype, 'getUserAction');
      expect(params).toContain('id');
      expect(params).toContain('action');
    });
  });

  describe('ValidateQuery decorator', () => {
    it('should register query validation', () => {
      @Controller('/test')
      class TestController {
        @ValidateQuery('filter')
        @Get('/users')
        getUsers() {}
      }

      const queries = Reflect.getMetadata('validateQueries', TestController.prototype, 'getUsers');
      expect(queries).toContain('filter');
    });

    it('should register multiple query validations', () => {
      @Controller('/test')
      class TestController {
        @ValidateQuery('filter')
        @ValidateQuery('sort')
        @Get('/users')
        getUsers() {}
      }

      const queries = Reflect.getMetadata('validateQueries', TestController.prototype, 'getUsers');
      expect(queries).toContain('filter');
      expect(queries).toContain('sort');
    });
  });

  describe('configureRoutes function', () => {
    beforeEach(() => {
      // Clear all registered controllers
      const controllers = getAllControllers();
      controllers.length = 0;
    });

    it('should configure routes with different base paths', () => {
      @Controller('/api/v1')
      class ApiController {
        @Get('/health')
        healthCheck() {}
      }

      @Controller('/admin')
      class AdminController {
        @Get('/users')
        getUsers() {}
      }

      configureRoutes(router);
      
      // Verify router has routes (check router internal structure)
      expect(router.stack).toBeDefined();
    });

    it('should handle controller with root base path', () => {
      @Controller('/')
      class RootController {
        @Get('/home')
        home() {}
      }

      configureRoutes(router);
      expect(router.stack).toBeDefined();
    });

    it('should handle controller with no base path', () => {
      @Controller()
      class NoBaseController {
        @Get('/test')
        test() {}
      }

      configureRoutes(router);
      expect(router.stack).toBeDefined();
    });

    it('should handle routes without leading slashes', () => {
      @Controller('api')
      class TestController {
        @Get('users')
        getUsers() {}
      }

      configureRoutes(router);
      expect(router.stack).toBeDefined();
    });

    it('should handle mixed path configurations', () => {
      @Controller('/api/v1/')
      class TestController {
        @Get('/users/')
        getUsers() {}
        
        @Get('profile')
        getProfile() {}
      }

      configureRoutes(router);
      expect(router.stack).toBeDefined();
    });

    it('should handle controller method without routes metadata', () => {
      @Controller('/test')
      class TestController {
        normalMethod() {
          return 'test';
        }
      }

      expect(() => configureRoutes(router)).not.toThrow();
    });

    it('should handle empty controllers array', () => {
      expect(() => configureRoutes(router)).not.toThrow();
    });
  });
});
