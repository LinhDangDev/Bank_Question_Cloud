/**
 * Script to clean unwanted text patterns from question content in database
 * Author: Linh Dang Dev
 * Created: 2025-07-11
 *
 * This script removes patterns like "câu 1 2 3 4", "bài 1 2 3 4" from question content
 * without deleting the questions themselves.
 */

const sql = require('mssql');
require('dotenv').config({ path: '.env' });

class QuestionCleaner {
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
            // Vietnamese patterns
            /\bcâu\s+\d+(\s+\d+)*/gi,  // "câu 1", "câu 1 2 3 4"
            /\bbài\s+\d+(\s+\d+)*/gi,  // "bài 1", "bài 1 2 3 4"
            /\bCâu\s+\d+(\s+\d+)*/g,   // "Câu 1", "Câu 1 2 3 4"
            /\bBài\s+\d+(\s+\d+)*/g,   // "Bài 1", "Bài 1 2 3 4"

            // English patterns
            /\bquestion\s+\d+(\s+\d+)*/gi,  // "question 1", "question 1 2 3 4"
            /\bQuestion\s+\d+(\s+\d+)*/g,   // "Question 1", "Question 1 2 3 4"
            /\bexercise\s+\d+(\s+\d+)*/gi,  // "exercise 1", "exercise 1 2 3 4"
            /\bExercise\s+\d+(\s+\d+)*/g,   // "Exercise 1", "Exercise 1 2 3 4"

            // Number patterns at start of content
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
                removed.push(...matches.map(match => `Pattern ${index + 1}: "${match.trim()}"`));
                cleaned = cleaned.replace(pattern, ' ');
            }
        });

        // Clean up extra spaces and line breaks
        cleaned = cleaned.replace(/\s{2,}/g, ' ');  // Multiple spaces to single
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');  // Multiple newlines to double
        cleaned = cleaned.trim();  // Remove leading/trailing whitespace

        return { cleaned, removed };
    }

    async getSampleQuestions(limit = 10) {
        try {
            const query = `
                SELECT TOP (@limit)
                    MaCauHoi,
                    MaSoCauHoi,
                    NoiDung,
                    LEN(NoiDung) as ContentLength
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

            const request = this.pool.request();
            request.input('limit', sql.Int, limit);
            const result = await request.query(query);

            console.log(`📊 Retrieved ${result.recordset.length} sample questions`);
            return result.recordset;

        } catch (error) {
            console.error('❌ Error getting sample questions:', error.message);
            return [];
        }
    }

    async countAffectedQuestions() {
        try {
            const query = `
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
                        OR NoiDung LIKE '%exercise %'
                        OR NoiDung LIKE '%Exercise %'
                        OR NoiDung LIKE '%1.%'
                        OR NoiDung LIKE '%2.%'
                        OR NoiDung LIKE '%3.%'
                        OR NoiDung LIKE '%4.%'
                        OR NoiDung LIKE '%(1)%'
                        OR NoiDung LIKE '%(2)%'
                    )
            `;

            const result = await this.pool.request().query(query);
            return result.recordset[0].total_count;

        } catch (error) {
            console.error('❌ Error counting affected questions:', error.message);
            return 0;
        }
    }

    async previewCleanup(limit = 10) {
        console.log(`🔍 Previewing cleanup for ${limit} questions...`);

        const questions = await this.getSampleQuestions(limit);
        if (questions.length === 0) {
            console.log('⚠️ No questions found for preview');
            return;
        }

        let changesCount = 0;

        questions.forEach((question, index) => {
            const original = question.NoiDung;
            const { cleaned, removed } = this.cleanContent(original);

            if (original !== cleaned) {
                changesCount++;
                console.log(`\n--- Question ${question.MaSoCauHoi} (ID: ${question.MaCauHoi.substring(0, 8)}...) ---`);
                console.log(`📏 Original length: ${original.length} chars`);
                console.log(`📏 Cleaned length: ${cleaned.length} chars`);
                console.log(`🗑️ Removed patterns: ${removed.join(', ')}`);
                console.log(`📝 BEFORE: ${original.substring(0, 200)}${original.length > 200 ? '...' : ''}`);
                console.log(`✨ AFTER:  ${cleaned.substring(0, 200)}${cleaned.length > 200 ? '...' : ''}`);
            }
        });

        console.log(`\n📊 Preview complete: ${changesCount}/${questions.length} questions would be modified`);
        return changesCount;
    }

    async performCleanup(dryRun = true) {
        console.log(`${dryRun ? '🔍 DRY RUN:' : '🚀 EXECUTING:'} Starting cleanup process...`);

        const questions = await this.getSampleQuestions(1000); // Get more for actual cleanup
        if (questions.length === 0) {
            console.log('⚠️ No questions found for cleanup');
            return;
        }

        let updatedCount = 0;
        const transaction = this.pool.transaction();

        try {
            if (!dryRun) {
                await transaction.begin();
            }

            for (const question of questions) {
                const original = question.NoiDung;
                const { cleaned, removed } = this.cleanContent(original);

                if (original !== cleaned) {
                    updatedCount++;

                    if (dryRun) {
                        console.log(`📝 Would update question ${question.MaSoCauHoi}: ${removed.join(', ')}`);
                    } else {
                        const request = transaction.request();
                        request.input('noiDung', sql.NVarChar(sql.MAX), cleaned);
                        request.input('maCauHoi', sql.UniqueIdentifier, question.MaCauHoi);

                        await request.query(`
                            UPDATE CauHoi
                            SET NoiDung = @noiDung, NgaySua = GETDATE()
                            WHERE MaCauHoi = @maCauHoi
                        `);

                        console.log(`✅ Updated question ${question.MaSoCauHoi}`);
                    }
                }
            }

            if (!dryRun) {
                await transaction.commit();
                console.log(`✅ Successfully updated ${updatedCount} questions`);
            } else {
                console.log(`📊 Dry run complete: ${updatedCount} questions would be updated`);
            }

        } catch (error) {
            if (!dryRun) {
                await transaction.rollback();
            }
            console.error('❌ Error during cleanup:', error.message);
        }
    }
}

async function main() {
    console.log('🧹 Question Content Cleaner - Starting...\n');
    console.log('📋 Environment variables:');
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   DB_DATABASE:', process.env.DB_DATABASE);
    console.log('   DB_USERNAME:', process.env.DB_USERNAME);
    console.log('');

    const cleaner = new QuestionCleaner();

    try {
        // Connect to database
        if (!(await cleaner.connect())) {
            console.error('❌ Failed to connect to database. Exiting.');
            return;
        }

        // Count affected questions
        const affectedCount = await cleaner.countAffectedQuestions();
        console.log(`📊 Found ${affectedCount} questions that may need cleaning\n`);

        if (affectedCount === 0) {
            console.log('✅ No questions found that need cleaning. Exiting.');
            await cleaner.disconnect();
            return;
        }

        // Preview cleanup
        const previewLimit = Math.min(10, affectedCount);
        const changesInPreview = await cleaner.previewCleanup(previewLimit);

        console.log(`\n📋 Summary:`);
        console.log(`   - Total questions that may need cleaning: ${affectedCount}`);
        console.log(`   - Questions with changes in preview: ${changesInPreview}/${previewLimit}`);
        console.log(`\n⚠️ This is a PREVIEW ONLY. No database changes have been made.`);
        console.log(`   To perform actual cleanup, modify the script to call performCleanup(false)`);

        await cleaner.disconnect();
        console.log('\n✅ Script completed successfully');

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        await cleaner.disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = QuestionCleaner;
