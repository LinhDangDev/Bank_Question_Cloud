const fs = require('fs');
const path = require('path');

// Path to .env file
const envPath = path.join(__dirname, '.env');
const dbEnvPath = path.join(__dirname, 'db_env.txt');

console.log('\n🔍 Database Environment Status');
console.log('==============================');

try {
  let currentEnv = 'local'; // default
  
  // Check db_env.txt first
  if (fs.existsSync(dbEnvPath)) {
    const dbEnvContent = fs.readFileSync(dbEnvPath, 'utf8').trim();
    if (dbEnvContent) {
      currentEnv = dbEnvContent;
      console.log(`📄 Environment from db_env.txt: ${currentEnv.toUpperCase()}`);
    }
  }
  
  // Check .env file
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DB_ENV\s*=\s*([^\s\r\n]+)/);
    if (match) {
      currentEnv = match[1];
      console.log(`📄 Environment from .env: ${currentEnv.toUpperCase()}`);
    }
  } else {
    console.log('⚠️  .env file not found');
  }

  console.log(`\n🎯 Current Database Environment: ${currentEnv.toUpperCase()}`);
  
  // Show connection details based on environment
  if (currentEnv === 'local') {
    console.log('\n📍 Local Database Configuration:');
    console.log('   Host: localhost');
    console.log('   Port: 1433');
    console.log('   Database: question_bank');
    console.log('   Auth: Windows Authentication or SQL Server Auth');
  } else if (currentEnv === 'server') {
    console.log('\n📍 Server Database Configuration:');
    console.log('   Host: 103.173.226.35');
    console.log('   Port: 1433');
    console.log('   Database: question_bank');
    console.log('   Auth: SQL Server Authentication');
  }
  
  console.log('\n💡 Available Commands:');
  console.log('   pnpm run db:local  - Switch to local database');
  console.log('   pnpm run db:server - Switch to server database');
  console.log('   pnpm run db:test   - Test current connection');
  console.log('   pnpm run db:switch - Interactive switcher');
  
} catch (err) {
  console.error('❌ Error reading database configuration:', err.message);
  process.exit(1);
}
