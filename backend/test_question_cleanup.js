/**
 * Simple test script to check question content patterns
 * Author: Linh Dang Dev
 */

const sql = require('mssql');
require('dotenv').config();

console.log('🧹 Question Content Pattern Checker - Starting...\n');

// Database configuration
const config = {
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || 'Pass123@',
    database: process.env.DB_DATABASE || 'question_bank',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

console.log('📋 Database config:');
console.log('   Server:', config.server);
console.log('   Database:', config.database);
console.log('   User:', config.user);
console.log('');

// Define patterns to check
const patterns = [
    { name: 'câu + numbers', regex: /\bcâu\s+\d+(\s+\d+)*/gi },
    { name: 'bài + numbers', regex: /\bbài\s+\d+(\s+\d+)*/gi },
    { name: 'Câu + numbers', regex: /\bCâu\s+\d+(\s+\d+)*/g },
    { name: 'Bài + numbers', regex: /\bBài\s+\d+(\s+\d+)*/g },
    { name: 'question + numbers', regex: /\bquestion\s+\d+(\s+\d+)*/gi },
    { name: 'Question + numbers', regex: /\bQuestion\s+\d+(\s+\d+)*/g },
    { name: 'Number at start', regex: /^\s*\d+[\.\)]\s*/gm },
    { name: 'Parentheses number', regex: /^\s*\(\d+\)\s*/gm }
];

function analyzeContent(content) {
    const results = [];
    patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
            results.push({
                pattern: pattern.name,
                matches: matches,
                count: matches.length
            });
        }
    });
    return results;
}

function cleanContent(content) {
    let cleaned = content;
    const removed = [];

    patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
            removed.push(...matches.map(match => `${pattern.name}: "${match.trim()}"`));
            cleaned = cleaned.replace(pattern.regex, ' ');
        }
    });

    // Clean up extra spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return { cleaned, removed };
}

async function main() {
    try {
        console.log('⏳ Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected successfully!\n');

        // Get sample questions
        console.log('📊 Getting sample questions...');
        const result = await pool.request().query(`
            SELECT TOP 5
                MaCauHoi, 
                MaSoCauHoi, 
                NoiDung,
                LEN(NoiDung) as ContentLength
            FROM CauHoi 
            WHERE NoiDung IS NOT NULL 
                AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
            ORDER BY MaSoCauHoi
        `);

        console.log(`Found ${result.recordset.length} questions\n`);

        // Analyze each question
        result.recordset.forEach((question, index) => {
            console.log(`--- Question ${question.MaSoCauHoi} ---`);
            console.log(`Content (${question.ContentLength} chars):`);
            console.log(question.NoiDung.substring(0, 200) + (question.NoiDung.length > 200 ? '...' : ''));
            
            const analysis = analyzeContent(question.NoiDung);
            if (analysis.length > 0) {
                console.log('🔍 Found patterns:');
                analysis.forEach(result => {
                    console.log(`   ${result.pattern}: ${result.matches.join(', ')}`);
                });

                const { cleaned, removed } = cleanContent(question.NoiDung);
                console.log('✨ After cleaning:');
                console.log(cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : ''));
                console.log(`🗑️ Removed: ${removed.join(', ')}`);
            } else {
                console.log('✅ No problematic patterns found');
            }
            console.log('');
        });

        // Count total questions with patterns
        console.log('📊 Counting questions with patterns...');
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total_count
            FROM CauHoi 
            WHERE NoiDung IS NOT NULL 
                AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
                AND (
                    NoiDung LIKE '%câu %' 
                    OR NoiDung LIKE '%bài %'
                    OR NoiDung LIKE '%Câu %'
                    OR NoiDung LIKE '%Bài %'
                    OR NoiDung LIKE '%question %'
                    OR NoiDung LIKE '%Question %'
                    OR NoiDung LIKE '%1.%'
                    OR NoiDung LIKE '%2.%'
                    OR NoiDung LIKE '%(1)%'
                    OR NoiDung LIKE '%(2)%'
                )
        `);

        console.log(`📈 Total questions that may need cleaning: ${countResult.recordset[0].total_count}`);

        await pool.close();
        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

main();
