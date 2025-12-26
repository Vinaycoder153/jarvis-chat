import http from 'http';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/webhook-test/javispro212') {
    let body = '';

    req.on('data', chunk => (body += chunk.toString()));

    req.on('end', () => {
      try {
        const { message, user_id } = JSON.parse(body);

        if (!message) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'Message is required' }));
        }

        console.log(`[JARVIS] ${user_id || 'anonymous'}: ${message}`);

        const reply = `Acknowledged. Processing: "${message}"`;

        res.writeHead(200);
        res.end(JSON.stringify({ reply }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(5679, () => {
  console.log('Mock Jarvis server running at http://localhost:5679');
});