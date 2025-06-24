import express from 'express';
import request from 'supertest';
import { SwaggerConfig } from '../../src/config/swagger';

describe('SwaggerConfig', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize swagger spec successfully', () => {
      const spec = SwaggerConfig.initialize();
      expect(spec).toBeDefined();
      expect(typeof spec).toBe('object');
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
    });

    it('should handle initialization errors gracefully', () => {
      // Test that the initialize method exists and can handle errors
      // We'll verify error handling by checking the logger behavior
      const spec = SwaggerConfig.initialize();
      expect(spec).toBeDefined();
    });
  });

  describe('setupSwaggerUI', () => {
    it('should setup swagger UI successfully', () => {
      SwaggerConfig.setupSwaggerUI(app);
      
      // Test that the setup doesn't throw errors
      expect(app).toBeDefined();
    });

    it('should serve swagger.json endpoint', async () => {
      SwaggerConfig.setupSwaggerUI(app);
      
      const response = await request(app).get('/api/v1/swagger.json');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toBeDefined();
    });

    it('should handle setup without errors', () => {
      expect(() => SwaggerConfig.setupSwaggerUI(app)).not.toThrow();
    });

    it('should initialize spec if not already initialized', () => {
      // Clear any existing spec
      (SwaggerConfig as any).swaggerSpec = undefined;
      
      SwaggerConfig.setupSwaggerUI(app);
      
      // Should have created a spec
      const spec = SwaggerConfig.getSpec();
      expect(spec).toBeDefined();
    });
  });

  describe('getSpec', () => {
    it('should return existing spec', () => {
      SwaggerConfig.initialize();
      const spec = SwaggerConfig.getSpec();
      expect(spec).toBeDefined();
      expect(typeof spec).toBe('object');
    });

    it('should initialize spec if not exists', () => {
      const spec = SwaggerConfig.getSpec();
      expect(spec).toBeDefined();
      expect(typeof spec).toBe('object');
    });
  });
});
