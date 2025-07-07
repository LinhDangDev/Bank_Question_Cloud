const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to .env file
const envPath = path.join(__dirname, '.env');
const dbEnvPath = path.join(__dirname, 'db_env.txt');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getCurrentEnv() {
  // Check db_env.txt first
  if (fs.existsSync(dbEnvPath)) {
    const dbEnvContent = fs.readFileSync(dbEnvPath, 'utf8').trim();
    if (dbEnvContent) {
      return dbEnvContent;
    }
  }
  
  // Check .env file
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/DB_ENV\s*=\s*([^\s\r\n]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return 'local'; // default
}

function switchEnvironment(env) {
  try {
    // Update db_env.txt
    fs.writeFileSync(dbEnvPath, env, 'utf8');
    
    // Update .env file if it exists
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      
      if (content.match(/DB_ENV\s*=\s*[^\s\r\n]+/)) {
        // Replace existing setting
        content = content.replace(/DB_ENV\s*=\s*[^\s\r\n]+/, `DB_ENV=${env}`);
      } else {
        // Add setting at the top
        content = `DB_ENV=${env}\n${content}`;
      }
      
      fs.writeFileSync(envPath, content, 'utf8');
    }
    
    console.log(`\n✅ Database environment switched to: ${env.toUpperCase()}`);
    console.log('🔄 Please restart your application for changes to take effect.');
    
  } catch (err) {
    console.error('❌ Error switching environment:', err.message);
    process.exit(1);
  }
}

function showMenu() {
  const currentEnv = getCurrentEnv();
  
  console.log('\n🔧 Database Environment Switcher');
  console.log('=================================');
  console.log(`Current environment: ${currentEnv.toUpperCase()}`);
  console.log('\nAvailable options:');
  console.log('1) Local Database (localhost)');
  console.log('2) Server Database (103.173.226.35)');
  console.log('3) Show current status');
  console.log('4) Exit');
  
  rl.question('\nEnter your choice (1-4): ', (answer) => {
    switch (answer.trim()) {
      case '1':
        switchEnvironment('local');
        rl.close();
        break;
      case '2':
        switchEnvironment('server');
        rl.close();
        break;
      case '3':
        console.log(`\n📍 Current Environment: ${currentEnv.toUpperCase()}`);
        if (currentEnv === 'local') {
          console.log('   Host: localhost:1433');
          console.log('   Database: question_bank');
        } else {
          console.log('   Host: 103.173.226.35:1433');
          console.log('   Database: question_bank');
        }
        showMenu(); // Show menu again
        break;
      case '4':
        console.log('\n👋 Goodbye!');
        rl.close();
        break;
      default:
        console.log('\n❌ Invalid choice. Please try again.');
        showMenu(); // Show menu again
        break;
    }
  });
}

// Start the interactive menu
showMenu();
