/**
 * Script to execute actual cleanup of question content patterns
 * Author: Linh Dang Dev
 * Created: 2025-07-11
 * 
 * This script performs the actual database updates to remove unwanted patterns
 */

const sql = require('mssql');
const readline = require('readline');
require('dotenv').config({ path: '.env' });

class QuestionCleanupExecutor {
    constructor() {
        // Database configuration
        this.config = {
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
        this.patternsToRemove = [
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
    }

    async connect() {
        try {
            this.pool = await sql.connect(this.config);
            console.log('✅ Successfully connected to database');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.close();
            console.log('✅ Disconnected from database');
        }
    }

    cleanContent(content) {
        if (!content) return { cleaned: content, removed: [] };

        let cleaned = content;
        const removed = [];

        // Apply each pattern
        this.patternsToRemove.forEach((pattern, index) => {
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

    async getAllQuestionsToClean() {
        try {
            const query = `
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
            `;

            const result = await this.pool.request().query(query);
            console.log(`📊 Found ${result.recordset.length} questions to process`);
            return result.recordset;

        } catch (error) {
            console.error('❌ Error getting questions:', error.message);
            return [];
        }
    }

    async executeCleanup() {
        console.log('🚀 Starting actual cleanup process...\n');

        const questions = await this.getAllQuestionsToClean();
        if (questions.length === 0) {
            console.log('⚠️ No questions found for cleanup');
            return;
        }

        let updatedCount = 0;
        let skippedCount = 0;
        const transaction = this.pool.transaction();

        try {
            await transaction.begin();
            console.log('📝 Transaction started...\n');

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const original = question.NoiDung;
                const { cleaned, removed } = this.cleanContent(original);

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
                    
                    console.log(`✅ [${i+1}/${questions.length}] Updated question ${question.MaSoCauHoi} - Removed: ${removed.join(', ')}`);
                } else {
                    skippedCount++;
                    if (skippedCount % 50 === 0) {
                        console.log(`⏭️ [${i+1}/${questions.length}] Skipped ${skippedCount} questions (no changes needed)`);
                    }
                }

                // Progress indicator
                if ((i + 1) % 100 === 0) {
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
    }

    async getUserConfirmation() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('Type "YES" to proceed with cleanup or anything else to cancel: ', (answer) => {
                rl.close();
                resolve(answer.trim().toUpperCase() === 'YES');
            });
        });
    }
}

async function main() {
    console.log('🧹 Question Content Cleanup Executor - Starting...\n');

    const executor = new QuestionCleanupExecutor();

    try {
        // Connect to database
        if (!(await executor.connect())) {
            console.error('❌ Failed to connect to database. Exiting.');
            return;
        }

        // Get questions to clean
        const questions = await executor.getAllQuestionsToClean();
        
        if (questions.length === 0) {
            console.log('✅ No questions found that need cleaning. Exiting.');
            await executor.disconnect();
            return;
        }

        // Show summary and ask for confirmation
        console.log(`\n📋 Cleanup Summary:`);
        console.log(`   - Database: ${executor.config.database}`);
        console.log(`   - Server: ${executor.config.server}`);
        console.log(`   - Questions to be cleaned: ${questions.length}`);
        console.log(`\n⚠️ WARNING: This will permanently modify question content in the database!`);
        console.log(`   - Patterns like "Câu 1:", "Bài 2:", etc. will be removed`);
        console.log(`   - A backup is recommended before proceeding`);
        console.log(`\n❓ Do you want to proceed?`);

        const confirmed = await executor.getUserConfirmation();
        
        if (confirmed) {
            await executor.executeCleanup();
        } else {
            console.log('\n❌ Cleanup cancelled by user.');
        }

        await executor.disconnect();
        console.log('\n✅ Script completed successfully');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        await executor.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = QuestionCleanupExecutor;
