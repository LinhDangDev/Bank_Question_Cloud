const sql = require('mssql/msnodesqlv8');

// Create connection configuration with Windows Authentication
const config = {
  driver: 'msnodesqlv8',
  server: 'Dev\\SQLEXPRESS', // Replace with your SQL Server instance
  database: 'question_bank',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
    integratedSecurity: true
  }
};

console.log('Attempting to connect to SQL Server using Windows Authentication...');
console.log('Connection config:', config);

// Attempt connection
sql.connect(config)
  .then(() => {
    console.log('✅ Successfully connected to SQL Server!');
    // Test query
    return sql.query`SELECT TOP 5 name FROM sys.tables`;
  })
  .then(result => {
    console.log('Tables in database:');
    console.table(result.recordset);

    // Close connection
    return sql.close();
  })
  .then(() => {
    console.log('Connection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error(err);
    process.exit(1);
  });
