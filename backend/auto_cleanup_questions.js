/**
 * Automatic Question Content Cleanup Script
 * Author: Linh Dang Dev
 * Created: 2025-07-11
 * 
 * This script automatically removes unwanted patterns from question content
 */

const sql = require('mssql');
require('dotenv').config();

console.log('🧹 Auto Question Content Cleanup - Starting...\n');

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

// Define patterns to remove
const patternsToRemove = [
    /\bcâu\s+\d+(\s+\d+)*\s*:\s*/gi,  // "câu 1:", "câu 1 2 3 4:"
    /\bbài\s+\d+(\s+\d+)*\s*:\s*/gi,  // "bài 1:", "bài 1 2 3 4:"
    /\bCâu\s+\d+(\s+\d+)*\s*:\s*/g,   // "Câu 1:", "Câu 1 2 3 4:"
    /\bBài\s+\d+(\s+\d+)*\s*:\s*/g,   // "Bài 1:", "Bài 1 2 3 4:"
    /\bquestion\s+\d+(\s+\d+)*\s*:\s*/gi,  // "question 1:", "question 1 2 3 4:"
    /\bQuestion\s+\d+(\s+\d+)*\s*:\s*/g,   // "Question 1:", "Question 1 2 3 4:"
    /\bexercise\s+\d+(\s+\d+)*\s*:\s*/gi,  // "exercise 1:", "exercise 1 2 3 4:"
    /\bExercise\s+\d+(\s+\d+)*\s*:\s*/g,   // "Exercise 1:", "Exercise 1 2 3 4:"
    /^\s*\d+[\.\)]\s*/gm,  // "1. ", "1) ", "2. ", etc at start
    /^\s*\(\d+\)\s*/gm,    // "(1) ", "(2) ", etc at start
];

function cleanContent(content) {
    if (!content) return { cleaned: content, removed: [] };

    let cleaned = content;
    const removed = [];

    // Apply each pattern
    patternsToRemove.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
            removed.push(...matches.map(match => `"${match.trim()}"`));
            cleaned = cleaned.replace(pattern, '');
        }
    });

    // Clean up extra spaces and line breaks
    cleaned = cleaned.replace(/\s{2,}/g, ' ');  // Multiple spaces to single
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // Multiple newlines to double
    cleaned = cleaned.trim();  // Remove leading/trailing whitespace

    return { cleaned, removed };
}

async function main() {
    try {
        console.log('📋 Database config:');
        console.log('   Server:', config.server);
        console.log('   Database:', config.database);
        console.log('   User:', config.user);
        console.log('');

        console.log('⏳ Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected successfully!\n');

        // Get all questions that need cleaning
        console.log('📊 Getting questions to clean...');
        const result = await pool.request().query(`
            SELECT 
                MaCauHoi, 
                MaSoCauHoi, 
                NoiDung
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
                    OR NoiDung LIKE '%exercise %'
                    OR NoiDung LIKE '%Exercise %'
                    OR NoiDung LIKE '%1.%'
                    OR NoiDung LIKE '%2.%'
                    OR NoiDung LIKE '%3.%'
                    OR NoiDung LIKE '%4.%'
                    OR NoiDung LIKE '%(1)%'
                    OR NoiDung LIKE '%(2)%'
                )
            ORDER BY MaSoCauHoi
        `);

        const questions = result.recordset;
        console.log(`Found ${questions.length} questions to process\n`);

        if (questions.length === 0) {
            console.log('✅ No questions need cleaning. Exiting.');
            await pool.close();
            return;
        }

        // Start transaction
        console.log('🚀 Starting cleanup process...');
        const transaction = pool.transaction();
        await transaction.begin();

        let updatedCount = 0;
        let skippedCount = 0;

        try {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const original = question.NoiDung;
                const { cleaned, removed } = cleanContent(original);

                if (original !== cleaned) {
                    updatedCount++;
                    
                    const request = transaction.request();
                    request.input('noiDung', sql.NVarChar(sql.MAX), cleaned);
                    request.input('maCauHoi', sql.UniqueIdentifier, question.MaCauHoi);
                    
                    await request.query(`
                        UPDATE CauHoi 
                        SET NoiDung = @noiDung, NgaySua = GETDATE()
                        WHERE MaCauHoi = @maCauHoi
                    `);
                    
                    console.log(`✅ [${i+1}/${questions.length}] Updated Q${question.MaSoCauHoi} - Removed: ${removed.join(', ')}`);
                } else {
                    skippedCount++;
                }

                // Progress indicator
                if ((i + 1) % 50 === 0) {
                    console.log(`📊 Progress: ${i+1}/${questions.length} processed (${updatedCount} updated, ${skippedCount} skipped)`);
                }
            }

            await transaction.commit();
            console.log('\n🎉 Cleanup completed successfully!');
            console.log(`📊 Final results:`);
            console.log(`   - Total questions processed: ${questions.length}`);
            console.log(`   - Questions updated: ${updatedCount}`);
            console.log(`   - Questions skipped: ${skippedCount}`);

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error during cleanup, transaction rolled back:', error.message);
            throw error;
        }

        await pool.close();
        console.log('\n✅ Database connection closed');
        console.log('✅ Script completed successfully');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Add confirmation before running
console.log('⚠️ WARNING: This script will modify question content in the database!');
console.log('   - Patterns like "Câu 1:", "Bài 2:", etc. will be removed');
console.log('   - This action cannot be undone easily');
console.log('');
console.log('🚀 Starting in 3 seconds... Press Ctrl+C to cancel');

setTimeout(() => {
    main();
}, 3000);
