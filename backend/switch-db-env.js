const fs = require('fs');
const path = require('path');

// Path to .env file
const envPath = path.join(__dirname, '.env');

// Default .env content template
const defaultEnvContent = `# Database environment (local or server)
DB_ENV=local

# Local database settings
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourPassword123
DB_DATABASE=question_bank

# Server database settings
SERVER_DB_HOST=your-server-hostname
SERVER_DB_PORT=1433
SERVER_DB_USERNAME=server_username
SERVER_DB_PASSWORD=ServerPassword123
SERVER_DB_DATABASE=server_database
`;

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.error(`Error: No .env file found at ${envPath}`);
  console.log('Creating a default .env file...');
  fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
  console.log('Default .env file created. Please update the passwords.');
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const env = args[0]?.toLowerCase();

// Validate input
if (!env || (env !== 'local' && env !== 'server')) {
  console.log('\n🔍 Database Environment Switcher');
  console.log('=============================');
  console.log('Usage: node switch-db-env.js [local|server]');
  console.log('\nOptions:');
  console.log('  local  - Use local database connection');
  console.log('  server - Use server database connection');

  // Show current setting
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DB_ENV\s*=\s*([^\s\r\n]+)/);
    if (match) {
      console.log(`\nCurrent setting: DB_ENV=${match[1]}`);
    }
  } catch (err) {
    console.error('Error reading current setting:', err.message);
  }

  process.exit(1);
}

try {
  // Read current .env file
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add DB_ENV setting
  if (content.match(/DB_ENV\s*=\s*[^\s\r\n]+/)) {
    // Replace existing setting
    content = content.replace(/DB_ENV\s*=\s*[^\s\r\n]+/, `DB_ENV=${env}`);
  } else {
    // Add setting at the top
    content = `DB_ENV=${env}\n${content}`;
  }

  // Write back to file
  fs.writeFileSync(envPath, content, 'utf8');

  console.log(`\n✅ Database environment set to: ${env}`);
  console.log('Restart your application for changes to take effect.');

} catch (err) {
  console.error('Error updating .env file:', err.message);
  process.exit(1);
}
