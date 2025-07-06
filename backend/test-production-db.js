/**
 * Script to test production database connection
 * Usage: node test-production-db.js
 */

const sql = require('mssql');
require('dotenv').config({ path: '.env.production' });

const config = {
    server: process.env.SERVER_DB_HOST || '103.173.226.35',
    port: parseInt(process.env.SERVER_DB_PORT || '1433'),
    user: process.env.SERVER_DB_USERNAME || 'sa',
    password: process.env.SERVER_DB_PASSWORD || 'Pass123@',
    database: process.env.SERVER_DB_DATABASE || 'question_bank',
    options: {
        encrypt: process.env.SERVER_DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.SERVER_DB_TRUST_SERVER_CERTIFICATE !== 'false',
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function testConnection() {
    console.log('🔍 Testing production database connection...');
    console.log('Configuration:', {
        server: config.server,
        port: config.port,
        database: config.database,
        user: config.user,
        encrypt: config.options.encrypt,
        trustServerCertificate: config.options.trustServerCertificate
    });

    try {
        console.log('\n⏳ Connecting to SQL Server...');
        const pool = await sql.connect(config);
        
        console.log('✅ Connected successfully!');
        
        // Test basic query
        console.log('\n⏳ Testing basic query...');
        const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database_name, GETDATE() as current_time');
        
        console.log('✅ Query executed successfully!');
        console.log('Database info:', result.recordset[0]);
        
        // Test application tables
        console.log('\n⏳ Checking application tables...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND TABLE_NAME IN ('CauHoi', 'MonHoc', 'NguoiDung', 'KyThi')
            ORDER BY TABLE_NAME
        `);
        
        console.log('✅ Application tables found:');
        tablesResult.recordset.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        await pool.close();
        console.log('\n🎉 Production database connection test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Database connection failed:');
        console.error('Error:', error.message);
        
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        
        if (error.originalError) {
            console.error('Original Error:', error.originalError.message);
        }
        
        // Common troubleshooting tips
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check if SQL Server is running and accessible');
        console.log('2. Verify firewall settings allow connections on port 1433');
        console.log('3. Confirm SQL Server authentication is enabled');
        console.log('4. Check username and password are correct');
        console.log('5. Ensure the database exists');
        
        process.exit(1);
    }
}

testConnection();
