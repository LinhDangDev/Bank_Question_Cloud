/**
 * Simple script to test the current database connection
 * Usage: node test-db-connection.js
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Get current database environment from file
const getCurrentEnvironment = () => {
  // Check if db_env.txt exists
  const envFilePath = path.join(__dirname, 'db_env.txt');

  if (fs.existsSync(envFilePath)) {
    return fs.readFileSync(envFilePath, 'utf8').trim();
  }

  // Check .env file for DB_ENV
  const dotEnvPath = path.join(__dirname, '.env');
  if (fs.existsSync(dotEnvPath)) {
    const content = fs.readFileSync(dotEnvPath, 'utf8');
    const match = content.match(/DB_ENV\s*=\s*([^\s\r\n]+)/);
    if (match) return match[1];
  }

  return 'local'; // Default to local
};

// Load .env file
const loadEnvFile = () => {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}Error: No .env file found at ${envPath}${colors.reset}`);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  const env = {};
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';

      // Remove quotes if they exist
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  }

  return env;
};

// Main function
async function main() {
  try {
    const env = loadEnvFile();
    const currentEnv = getCurrentEnvironment();

    console.log(`\n${colors.cyan}==== Database Connection Test ====${colors.reset}`);
    console.log(`${colors.yellow}Current environment: ${colors.green}${currentEnv.toUpperCase()}${colors.reset}\n`);

    // Determine connection config based on environment
    let config;
    if (currentEnv === 'local') {
      // Check if using Windows Authentication
      if (env.DB_AUTH_TYPE === 'windows') {
        config = {
          server: env.DB_HOST || 'localhost',
          port: parseInt(env.DB_PORT || '1433', 10),
          database: env.DB_DATABASE || 'question_bank',
          options: {
            encrypt: false,
            trustServerCertificate: true,
            trustedConnection: true,
            integratedSecurity: true
          }
        };
        console.log(`${colors.white}Using Windows Authentication with Integrated Security${colors.reset}`);
      } else {
        config = {
          user: env.DB_USERNAME || 'sa',
          password: env.DB_PASSWORD,
          server: env.DB_HOST || 'localhost',
          port: parseInt(env.DB_PORT || '1433', 10),
          database: env.DB_DATABASE || 'question_bank',
          options: {
            encrypt: false,
            trustServerCertificate: true,
          }
        };
      }
    } else { // server
      config = {
        user: env.SERVER_DB_USERNAME || 'sa',
        password: env.SERVER_DB_PASSWORD || 'Pass123@',
        server: env.SERVER_DB_HOST || '103.173.226.35',
        port: parseInt(env.SERVER_DB_PORT || '1433', 10),
        database: env.SERVER_DB_DATABASE || 'question_bank',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        }
      };
      console.log(`${colors.white}Using SQL Server Authentication${colors.reset}`);
    }

    // Log connection details
    console.log(`${colors.white}Connecting to:${colors.reset}`);
    console.log(`- Server:   ${colors.cyan}${config.server}:${config.port}${colors.reset}`);
    console.log(`- Database: ${colors.cyan}${config.database}${colors.reset}`);

    if (config.options?.integratedSecurity) {
      console.log(`- Auth:     ${colors.cyan}Windows Authentication (Integrated Security)${colors.reset}`);
    } else if (config.options?.authentication?.type === 'ntlm') {
      const domain = config.options.authentication.options.domain;
      const user = config.options.authentication.options.userName;
      console.log(`- Auth:     ${colors.cyan}${domain}\\${user} (Windows Authentication)${colors.reset}`);
    } else {
      console.log(`- Auth:     ${colors.cyan}SQL Authentication (${config.user})${colors.reset}`);
    }

    console.log('');

    console.log(`${colors.yellow}Testing connection...${colors.reset}`);

    // Attempt to connect
    await sql.connect(config);

    // If we get here, the connection was successful
    console.log(`${colors.green}✓ Connection successful!${colors.reset}`);

    // Get server version
    const versionResult = await sql.query`SELECT @@VERSION as version`;
    console.log(`\n${colors.white}SQL Server version: ${colors.cyan}${versionResult.recordset[0].version.split('\n')[0]}${colors.reset}`);

    // Get database info
    const dbResult = await sql.query`SELECT DB_NAME() as db_name, USER_NAME() as user_name`;
    console.log(`${colors.white}Connected to database: ${colors.cyan}${dbResult.recordset[0].db_name}${colors.reset}`);
    console.log(`${colors.white}Connected as user: ${colors.cyan}${dbResult.recordset[0].user_name}${colors.reset}`);

    // Close connection
    await sql.close();

  } catch (err) {
    console.error(`\n${colors.red}Connection failed: ${err.message}${colors.reset}`);

    // Provide some common troubleshooting tips
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log('1. Check if the SQL Server is running');
    console.log('2. Verify the connection details in your .env file');
    console.log('3. Check that the database exists');
    console.log('4. Ensure that the user has access to the database');
    console.log('5. Check firewall settings if connecting to a remote server');
    console.log('6. For Windows Authentication, make sure the service is running as a user with database access');

    process.exit(1);
  }
}

main();
