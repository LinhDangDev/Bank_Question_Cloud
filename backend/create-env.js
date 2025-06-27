/**
 * Simple script to create and validate the .env file
 * Usage: node create-env.js
 */

const fs = require('fs');
const path = require('path');

// Path to .env file
const envPath = path.resolve(__dirname, '.env');

// Default .env content
const defaultEnvContent = `# Database environment (local or server)
DB_ENV=local

# Application settings
PORT=3001
NODE_ENV=development

# JWT settings
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1d

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
if (fs.existsSync(envPath)) {
  console.log(`\n.env file found at: ${envPath}`);

  // Read current content
  const content = fs.readFileSync(envPath, 'utf8');

  // Check for required variables
  const requiredVars = ['DB_ENV', 'DB_PASSWORD'];
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!content.match(new RegExp(`${varName}\\s*=\\s*[^\\s\\r\\n]+`))) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n⚠️  Warning: The following required variables are missing or empty:`);
    missingVars.forEach(v => console.log(`   - ${v}`));

    console.log('\nWould you like to update the .env file? (y/n)');
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        console.log('Updating .env file...');
        fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
        console.log('✅ .env file has been updated.');
      } else {
        console.log('No changes made to .env file.');
      }
      process.exit(0);
    });
  } else {
    console.log('✅ .env file looks valid.');

    // Show current DB_ENV setting
    const match = content.match(/DB_ENV\s*=\s*([^\s\r\n]+)/);
    if (match) {
      console.log(`Current database environment: ${match[1]}`);
      console.log('\nTo switch database environments, use:');
      console.log('  node switch-db-env.js local   - For local development');
      console.log('  node switch-db-env.js server  - For server connection');
    }

    process.exit(0);
  }
} else {
  console.log(`\nNo .env file found at: ${envPath}`);
  console.log('Creating default .env file...');

  fs.writeFileSync(envPath, defaultEnvContent, 'utf8');

  console.log('✅ Default .env file created.');
  console.log('Please update the passwords and server settings in the file.');
  process.exit(0);
}
