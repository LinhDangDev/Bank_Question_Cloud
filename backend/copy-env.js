const fs = require('fs');
const path = require('path');

// Define paths
const sourceEnvPath = path.join(__dirname, '.env');
const distDir = path.join(__dirname, 'dist');
const targetEnvPath = path.join(distDir, '.env');

// Make sure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy the .env file
try {
    if (fs.existsSync(sourceEnvPath)) {
        fs.copyFileSync(sourceEnvPath, targetEnvPath);
        console.log('\x1b[32m%s\x1b[0m', '✓ .env file copied to dist folder successfully');
    } else {
        console.log('\x1b[33m%s\x1b[0m', '⚠ .env file not found in project root');
    }
} catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✗ Error copying .env file:', err);
}
