const Module = require('module');
const orig = Module._load;
const mappings = {
  '@ai-platform/ai-core': 'D:/Project/ANT/ant-ai/dist/libs/ai-core',
  '@ai-platform/common': 'D:/Project/ANT/ant-ai/dist/libs/common',
  '@ai-platform/database': 'D:/Project/ANT/ant-ai/dist/libs/database',
  '@ai-platform/backend-client': 'D:/Project/ANT/ant-ai/dist/libs/backend-client',
};
Module._load = function(req, parent) {
  if (mappings[req]) {
    const args = [...arguments];
    args[0] = mappings[req];
    return orig.apply(this, args);
  }
  return orig.apply(this, arguments);
};
process.on('uncaughtException', (err) => { 
  require('fs').appendFileSync('debug.log', '[UNCAUGHT] ' + err.stack + '\n');
  console.error('[UNCAUGHT]', err); 
});
process.on('unhandledRejection', (err) => { 
  require('fs').appendFileSync('debug.log', '[UNHANDLED] ' + err + '\n');
  console.error('[UNHANDLED]', err); 
});

// Load .env
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, 'apps/ai-service/.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

require('./dist/apps/ai-service/src/main.js');
