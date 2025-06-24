// Test metadata retrieval
const { WeatherController } = require('./dist/src/controllers/WeatherController');

console.log('WeatherController:', WeatherController);
console.log('Constructor:', WeatherController.constructor);

// Test metadata retrieval
const routes = Reflect.getMetadata(Symbol.for('routes'), WeatherController);
const basePath = Reflect.getMetadata('basePath', WeatherController);

console.log('Routes metadata:', routes);
console.log('Base path metadata:', basePath);
console.log('Routes length:', routes ? routes.length : 'undefined');
