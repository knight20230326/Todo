#!/usr/bin/env node

const args = process.argv.slice(2);

// Check if this should be start Web server mode
const isWebMode = args.length === 0 || 
                  args[0] === 'start' || 
                  args[0] === 'web' ||
                  args.includes('--port') ||
                  args[0] === '--port';

if (isWebMode) {
  // Remove 'start' or 'web' command if present
  if (args[0] === 'start' || args[0] === 'web') {
    process.argv.splice(2, 1);
  }
  // Start Web server
  require('../src/server');
} else {
  // Start CLI
  require('../src/index');
}
