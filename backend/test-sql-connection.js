const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Define connection configurations to test
const configs = {
    localSqlAuth: {
        user: 'sa',
        password: 'Pass123@',
        server: 'localhost',
        port: 1433,
        database: 'question_bank',
        options: {
            enableArithAbort: true,
            encrypt: false,
            trustServerCertificate: true,
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    },

    windowsAuthVariant: {
        server: 'Dev\\SQLEXPRESS', // Try with Dev\SQLEXPRESS (computer name)
        database: 'question_bank',
        options: {
            enableArithAbort: true,
            encrypt: false,
            trustServerCertificate: true,
            trustedConnection: true,
            integratedSecurity: true,
        }
    },

    sqlAuth: {
        user: 'sa',
        password: 'Pass123@',
        server: '103.173.226.35',
        database: 'question_bank',
        options: {
            enableArithAbort: true,
            encrypt: false,
            trustServerCertificate: true
        }
    }
};

async function testConnections() {
    console.log('Testing SQL Server connections...');

    // Try SQL Authentication with localhost\SQLEXPRESS
    try {
        console.log('\n🔍 Testing SQL Authentication with localhost:1433...');
        await sql.connect(configs.localSqlAuth);
        console.log('✅ SUCCESS: Connected to SQL Server using SQL Authentication (localhost:1433)');
        await sql.close();
    } catch (err) {
        console.log('❌ FAILED: SQL Authentication (localhost:1433) connection error:');
        console.log(err);
    }

    // Try Windows Authentication with DEV\SQLEXPRESS
    try {
        console.log('\n🔍 Testing Windows Authentication with Dev\\SQLEXPRESS...');
        await sql.connect(configs.windowsAuthVariant);
        console.log('✅ SUCCESS: Connected to SQL Server using Windows Authentication (Dev\\SQLEXPRESS)');
        await sql.close();
    } catch (err) {
        console.log('❌ FAILED: Windows Authentication (Dev\\SQLEXPRESS) connection error:');
        console.log(err);
    }

    // Try SQL Authentication with remote server
    try {
        console.log('\n🔍 Testing SQL Authentication with remote server...');
        await sql.connect(configs.sqlAuth);
        console.log('✅ SUCCESS: Connected to SQL Server using SQL Authentication (remote)');
        await sql.close();
    } catch (err) {
        console.log('❌ FAILED: SQL Authentication (remote) connection error:');
        console.log(err);
    }
}

testConnections().catch(err => {
    console.error('Error in test script:', err);
});
