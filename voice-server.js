import http from 'http';

const PORT = process.env.PORT || 5678;
const WEBHOOK_PATH = '/webhook/javispro212';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  }

  // Main webhook endpoint
  if (req.method === 'POST' && req.url === WEBHOOK_PATH) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { message, user_id } = JSON.parse(body);

        // Validate request
        if (!message) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Message is required' }));
        }

        // Log incoming message
        console.log(`[${new Date().toISOString()}] [JARVIS] ${user_id || 'anonymous'}: ${message}`);

        // Generate contextual response
        const reply = `Acknowledged. Processing: "${message}"`;

        // Send response
        res.writeHead(200);
        res.end(JSON.stringify({ reply, timestamp: new Date().toISOString() }));
      } catch (error) {
        console.error('Webhook error:', error.message);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON', details: error.message }));
      }
    });

    // Handle read errors
    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(PORT, () => {
  console.log(`✓ JARVIS Webhook Server running at http://localhost:${PORT}`);
  console.log(`✓ Webhook endpoint: http://localhost:${PORT}${WEBHOOK_PATH}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});