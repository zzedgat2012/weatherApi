import { Application } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { logger } from './logger';

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Weather API',
            version: '1.0.0',
            description: 'A professional weather API with SQLite persistence and robust logging',
            contact: {
                name: 'Weather API Support',
                email: 'support@weatherapi.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.weatherapp.com',
                description: 'Production server'
            }
        ],
        components: {
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indicates if the request was successful'
                        },
                        message: {
                            type: 'string',
                            description: 'Human-readable message about the response'
                        },
                        data: {
                            type: 'object',
                            description: 'The response payload'
                        },
                        error: {
                            type: 'string',
                            description: 'Error message if request failed'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Response timestamp in ISO format'
                        }
                    },
                    required: ['success', 'message', 'timestamp']
                },
                WeatherData: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Database record ID'
                        },
                        city: {
                            type: 'string',
                            description: 'City name'
                        },
                        temperature: {
                            type: 'number',
                            description: 'Temperature in Celsius'
                        },
                        description: {
                            type: 'string',
                            description: 'Weather description'
                        },
                        humidity: {
                            type: 'number',
                            description: 'Humidity percentage'
                        },
                        windSpeed: {
                            type: 'number',
                            description: 'Wind speed in m/s'
                        },
                        windDirection: {
                            type: 'number',
                            description: 'Wind direction in degrees'
                        },
                        pressure: {
                            type: 'number',
                            description: 'Atmospheric pressure in hPa'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Weather data timestamp'
                        }
                    },
                    required: ['city', 'temperature', 'description']
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Health status message'
                        },
                        version: {
                            type: 'string',
                            description: 'API version'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Health check timestamp'
                        },
                        uptime: {
                            type: 'number',
                            description: 'Server uptime in seconds'
                        },
                        environment: {
                            type: 'string',
                            description: 'Current environment (development/production)'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        error: {
                            type: 'string',
                            description: 'Detailed error information'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            },
            responses: {
                Success: {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ApiResponse'
                            }
                        }
                    }
                },
                BadRequest: {
                    description: 'Bad request - Invalid parameters',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                InternalServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints'
            },
            {
                name: 'Weather',
                description: 'Weather data endpoints'
            }
        ]
    },
    apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // Path to the API docs
};

export class SwaggerConfig {
    private static swaggerSpec: object;

    static initialize(): object {
        try {
            SwaggerConfig.swaggerSpec = swaggerJSDoc(swaggerOptions);
            logger.info('Swagger documentation initialized successfully');
            return SwaggerConfig.swaggerSpec;
        } catch (error) {
            logger.error('Failed to initialize Swagger documentation', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    static setupSwaggerUI(app: Application): void {
        try {
            if (!SwaggerConfig.swaggerSpec) {
                SwaggerConfig.initialize();
            }

            // Swagger UI options
            const swaggerUiOptions = {
                customCss: `
                    .swagger-ui .topbar { display: none; }
                    .swagger-ui .info .title { color: #3b82f6; }
                `,
                customSiteTitle: 'Weather API Documentation',
                customfavIcon: '/favicon.ico',
                swaggerOptions: {
                    persistAuthorization: true,
                    displayRequestDuration: true,
                    docExpansion: 'tag',
                    filter: true,
                    showExtensions: true,
                    showCommonExtensions: true,
                    tryItOutEnabled: true
                }
            };

            // Serve Swagger documentation at /api/v1/docs
            app.use('/api/v1/docs', swaggerUi.serve);
            app.get('/api/v1/docs', swaggerUi.setup(SwaggerConfig.swaggerSpec, swaggerUiOptions));

            // Serve raw swagger.json
            app.get('/api/v1/swagger.json', (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(SwaggerConfig.swaggerSpec);
            });

            logger.info('Swagger UI configured successfully', {
                docsUrl: '/api/v1/docs',
                jsonUrl: '/api/v1/swagger.json'
            });

        } catch (error) {
            logger.error('Failed to setup Swagger UI', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    static getSpec(): object {
        return SwaggerConfig.swaggerSpec || SwaggerConfig.initialize();
    }
}

// Export singleton instance for easy access
export const swaggerSpec = SwaggerConfig.getSpec();
