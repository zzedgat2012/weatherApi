# Project: Weather API with TypeScript

## Context

I am an experienced TypeScript developer with a strong .NET background. I prefer building APIs using OOP patterns and class-based decorators for route definitions, similar to .NET-style controller structures.

This project is a weather visualization API written in TypeScript. I will use:

- Express with class decorators for route declaration.
- TypeORM for ORM and SQLite for local file-based persistence.
- Object-oriented programming structure with proper separation of concerns.
- ESM module structure with native `import` syntax.

## Goals

1. Create a REST API for weather data using Express.
2. Structure the app using OOP principles and decorators.
3. Use TypeORM to persist weather logs or configuration into SQLite.
4. Follow SOLID principles and clean architecture patterns when possible.

## Coding Conventions

- Use `src/` as the source root.
- All routes should be defined via decorators (e.g., `@Controller`, `@Get`, `@Post`).
- Models/entities go in `src/entities/`
- Services go in `src/services/`
- Controllers go in `src/controllers/`
- Configuration in `src/config/`
- Use ESBuild or tsx for dev builds (avoid `ts-node` if possible).

## Tools & Libraries

- `express`
- `typeorm`
- `reflect-metadata`
- `sqlite3`
- Decorator library (e.g., `routing-controllers`, `routing-controllers-express`, or custom)

## Example Usage

I want to query weather data via: `GET /weather/:city`
It should return a JSON with:

```json
{
  "city": "Aracaju",
  "temperature": "27°C",
  "humidity": "80%",
  "conditions": "Partly cloudy"
}
