// jest.setup.js
import '@testing-library/jest-dom';

// Make jest available globally for TypeScript files
import { jest } from '@jest/globals';
global.jest = jest;

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  lines.forEach((line) => {
    if (!line.trim() || line.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    const cleanValue = value.replace(/^["']|["']$/g, '');

    process.env[key.trim()] = cleanValue;
  });

  console.log('Jest setup initialized');
}