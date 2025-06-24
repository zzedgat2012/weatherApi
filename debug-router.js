const express = require('express');
const app = express();

// Create a test router
const router = express.Router();

// Add a test route
router.get('/api/v1/health', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Mount the router
app.use('/', router);

// Debug: Check the router stack
console.log('Router stack:', router.stack.length);
console.log('App has router:', !!app._router);

// List all routes
function printRoutes(app) {
  if (!app._router || !app._router.stack) {
    console.log('No router stack found');
    return;
  }
  
  app._router.stack.forEach((middleware, i) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods);
      console.log(`${i}: ${methods.join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      console.log(`${i}: router mounted`);
      middleware.handle.stack.forEach((subMiddleware, j) => {
        if (subMiddleware.route) {
          const methods = Object.keys(subMiddleware.route.methods);
          console.log(`  ${j}: ${methods.join(', ').toUpperCase()} ${subMiddleware.route.path}`);
        }
      });
    }
  });
}

console.log('\n=== All routes ===');
printRoutes(app);

// Test the route
const server = app.listen(4000, () => {
  console.log('Test server running on port 4000');
  
  // Make a test request
  const http = require('http');
  http.get('http://localhost:4000/api/v1/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', res.statusCode, data);
      server.close();
    });
  }).on('error', (err) => {
    console.error('Request error:', err);
    server.close();
  });
});
