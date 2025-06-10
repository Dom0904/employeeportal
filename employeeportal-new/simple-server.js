// Simple HTTP server to serve the React app
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

// Basic content type mapping
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jfif': 'image/jpeg'
};

// Create a server
http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Default to index.html for root
  let filePath = req.url === '/' 
    ? './build/index.html' 
    : './build' + req.url;
  
  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = contentTypes[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - serve index.html for client-side routing
        fs.readFile('./build/index.html', function(err, content) {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Other error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success - serve the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
}); 