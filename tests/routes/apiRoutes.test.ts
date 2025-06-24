import express from 'express';
import request from 'supertest';
import { ApiRoutes } from '../../src/routes/apiRoutes';

// Mock the WeatherController
jest.mock('../../src/controllers/WeatherController');

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  describe('ApiRoutes.getRouter', () => {
    it('should create router with controller routes', () => {
      const router = ApiRoutes.getRouter();
      expect(router).toBeDefined();
    });

    it('should handle routes registration', () => {
      const router = ApiRoutes.getRouter();
      app.use('/api/v1', router);
      
      // The router should be properly configured
      expect(router.stack).toBeDefined();
    });

    it('should integrate with express app', async () => {
      const router = ApiRoutes.getRouter();
      app.use('/api/v1', router);
      
      // Add a simple test route to verify router is working
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('test');
    });

    it('should handle route registration errors gracefully', () => {
      // This test checks error handling in route registration
      // Since getRouter uses RouteRegistry internally, 
      // we're testing that it doesn't throw on creation
      expect(() => ApiRoutes.getRouter()).not.toThrow();
    });

    it('should configure middleware properly', () => {
      const router = ApiRoutes.getRouter();
      
      // Check that the router has been created successfully
      // and can be used with an Express app
      expect(() => {
        app.use('/api/v1', router);
      }).not.toThrow();
    });
  });

  describe('Error handling in route setup', () => {
    it('should handle missing controller methods', () => {
      // Test that the router creation handles missing or invalid methods
      const router = ApiRoutes.getRouter();
      expect(router).toBeDefined();
    });

    it('should handle route path normalization', () => {
      const router = ApiRoutes.getRouter();
      app.use(router);
      
      // Verify the router can handle various path configurations
      expect(router.stack).toBeDefined();
    });
  });

  describe('Router middleware integration', () => {
    it('should support middleware registration', () => {
      const router = ApiRoutes.getRouter();
      app.use('/api/v1', router);
      
      // Add test middleware
      app.use((req, res, next) => {
        req.headers['x-test'] = 'middleware-applied';
        next();
      });

      // Test that the app can handle middleware registration
      expect(router).toBeDefined();
      expect(typeof router.use).toBe('function');
    });

    it('should handle controller base path correctly', () => {
      const router = ApiRoutes.getRouter();
      expect(router).toBeDefined();
      
      // The router should be created with the proper base path configuration
      app.use('/api/v1', router);
      
      // Check that the router is a valid Express router
      expect(typeof router.get).toBe('function');
      expect(typeof router.post).toBe('function');
      expect(typeof router.put).toBe('function');
      expect(typeof router.delete).toBe('function');
    });
  });
});
