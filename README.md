# 🌦️ Weather API - Professional MVC Architecture

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-5.1.7-lightgrey)](https://sqlite.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-brightgreen)](https://swagger.io/)

A professional weather API built with TypeScript, Express, and SQLite following strict MVC patterns with comprehensive logging, debugging support, and OpenAPI documentation.

## 📁 Project Structure (MVC)

```
src/
├── 📂 config/           # Configuration and setup
│   ├── data-source.ts   # Database connection & TypeORM config
│   ├── logger.ts        # Winston + Pino logging setup
│   ├── swagger.ts       # OpenAPI/Swagger configuration
│   └── vscode-debugger.ts # VSCode debug integration
├── 📂 controllers/      # HTTP request handlers (Controller layer)
│   └── WeatherController.ts # Weather endpoints logic
├── 📂 decorators/       # Custom TypeScript decorators
│   └── index.ts         # Logging, validation, debug decorators
├── 📂 entities/         # Database entities (Data layer)
│   └── WeatherLog.ts    # Weather data entity with TypeORM
├── 📂 middlewares/      # Express middlewares
│   ├── errorHandler.ts  # Global error handling
│   └── requestLogger.ts # Request logging middleware
├── 📂 models/           # Data models and DTOs
│   └── WeatherModels.ts # Weather DTOs and API response models
├── 📂 routes/           # Route definitions
│   └── apiRoutes.ts     # API v1 routes with middleware integration
├── 📂 services/         # Business logic (Service layer)
│   └── WeatherService.ts # Weather data processing and API calls
├── 📂 validators/       # Input validation middleware
│   └── weatherValidators.ts # City parameter validation
├── app.ts               # Express app configuration
└── index.ts             # Application entry point
```

## 🏗️ MVC Architecture

### **Model Layer**
- **Entities**: `WeatherLog.ts` - Database models with TypeORM decorators
- **Models**: `WeatherModels.ts` - DTOs, API responses, and data interfaces
- **Database**: SQLite with TypeORM for persistence

### **View Layer**
- **API-Only**: No traditional views, RESTful JSON responses
- **Documentation**: Swagger UI as interactive API documentation
- **Response Format**: Consistent `ApiResponse` wrapper for all endpoints

### **Controller Layer**
- **WeatherController**: Handles HTTP requests, delegates to services
- **Responsibilities**: Request/response handling, input validation coordination
- **No Business Logic**: Pure HTTP layer, delegates to service layer

### **Additional Layers**
- **Service Layer**: `WeatherService` - Business logic and external API calls
- **Middleware Layer**: Request logging, validation, error handling
- **Configuration Layer**: Database, logging, Swagger setup

## 🚀 Quick Start

### 1. Environment Setup
```bash
cp .env.example .env
# Add your OpenWeather API key to .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
make dev
# or
npm run dev
```

### 4. Access the API
- **API Base**: `http://localhost:3000/api/v1`
- **Documentation**: `http://localhost:3000/api/v1/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`

## 📚 API Documentation

### Swagger UI
Visit `http://localhost:3000/api/v1/docs` for interactive API documentation with:
- **Try it out** functionality
- Request/response schemas
- Example payloads
- Error responses

### Endpoints

#### Health Check
```
GET /api/v1/health
```
Returns API health status, version, and uptime.

#### Weather Data
```
GET /api/v1/weather/{city}
GET /api/v1/weather?city={city}
```
Retrieves current weather data for the specified city.

**Response Format:**
```json
{
  "success": true,
  "message": "Weather data for London",
  "data": {
    "city": "London",
    "temperature": 15.5,
    "description": "Partly cloudy",
    "humidity": 65,
    "windSpeed": 3.2,
    "windDirection": 180,
    "pressure": 1013.25,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🛠️ Development Tools

### Build Commands
```bash
make build    # Compile TypeScript
make start    # Start production server
make dev      # Start development server with watch
make clean    # Clean build directory
```

### VSCode Integration
- **Debug Configurations**: Multiple debug setups in `.vscode/launch.json`
- **Watch Variables**: Automatic variable monitoring in debug mode
- **Breakpoints**: Conditional breakpoints with decorators
- **Debug Console**: Interactive debugging with custom commands

### Logging & Monitoring
- **Multi-level Logging**: Winston + Pino with structured logs
- **Debug Mode**: Environment-based debug logging
- **Request Tracking**: Automatic request/response logging
- **Error Tracking**: Global error handling with stack traces

## 🔧 Configuration

### Environment Variables
```env
# OpenWeather API
OPENWEATHER_API_KEY=your_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./database/weather.db

# Debug & Logging
DEBUG=weather:*
VSCODE_DEBUG=true
LOG_LEVEL=info
```

### Database Configuration
- **Type**: SQLite
- **ORM**: TypeORM with decorators
- **Location**: `./database/weather.db`
- **Auto-sync**: Enabled in development

## 🧪 Testing Requests

### Using curl
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Weather by path parameter
curl http://localhost:3000/api/v1/weather/London

# Weather by query parameter
curl "http://localhost:3000/api/v1/weather?city=London"
```

### Using VSCode REST Client
Install the REST Client extension and use the examples in the Swagger documentation.

## 🐛 Debugging Guide

Detailed debugging instructions available in `DEBUG_GUIDE.md`:
- VSCode debug configurations
- Watch window variables
- Debug console commands
- Breakpoint strategies

## 📝 Code Quality

### TypeScript Configuration
- **Strict Mode**: Enabled with strict type checking
- **Decorators**: Experimental decorators enabled
- **Source Maps**: Generated for debugging
- **Target**: ES2020 with CommonJS modules

### Architectural Patterns
- **Dependency Injection**: Constructor injection for services
- **Singleton Pattern**: Database manager and logger instances
- **Decorator Pattern**: Custom decorators for cross-cutting concerns
- **Factory Pattern**: Configuration factories for different environments

## 🚀 Production Deployment

### Docker Support (Coming Soon)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment-specific Builds
```bash
NODE_ENV=production make build
NODE_ENV=production make start
```

## 🤝 Contributing

1. Follow the established MVC structure
2. Add appropriate TypeScript types
3. Include Swagger documentation for new endpoints
4. Add error handling and logging
5. Update tests and documentation

## 📄 License

MIT License - see LICENSE file for details.

---

### 🎯 Key Features

- ✅ **Strict MVC Architecture** - Clear separation of concerns
- ✅ **Professional Logging** - Winston + Pino with structured logging
- ✅ **VSCode Integration** - Advanced debugging and development tools  
- ✅ **SQLite Persistence** - TypeORM with automatic migrations
- ✅ **OpenAPI Documentation** - Interactive Swagger UI
- ✅ **Type Safety** - Full TypeScript with strict mode
- ✅ **Error Handling** - Global error middleware with consistent responses
- ✅ **Request Validation** - Middleware-based input validation
- ✅ **Development Tools** - Makefile, debug configs, and hot reload
