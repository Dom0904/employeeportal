// This is a simple script to start the React app
const { spawn } = require('child_process');
const path = require('path');

// Use the absolute path to node for any child processes
process.env.PATH = 'D:\\node;' + process.env.PATH;

// Start the React development server
console.log('Starting React development server...');
const reactScriptsPath = path.join(__dirname, 'node_modules', 'react-scripts', 'scripts', 'start.js');
const child = spawn('D:\\node\\node.exe', [reactScriptsPath], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('close', code => {
  console.log(`React development server exited with code ${code}`);
}); 