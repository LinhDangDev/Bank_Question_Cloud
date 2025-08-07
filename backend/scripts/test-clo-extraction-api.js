/**
 * Script to test CLO-based question extraction API
 * Author: Linh Dang Dev
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api'; // Adjust if different
const TEST_CONFIG = {
    // Test data - adjust these IDs based on your database
    maMonHoc: 'your-subject-id', // Replace with actual subject ID
    matrix: [
        {
            maPhan: 'chapter-1-id', // Replace with actual chapter ID
            clo1: 2,
            clo2: 1,
            clo3: 0,
            clo4: 0,
            clo5: 0
        },
        {
            maPhan: 'chapter-2-id', // Replace with actual chapter ID
            clo1: 1,
            clo2: 2,
            clo3: 1,
            clo4: 0,
            clo5: 0
        }
    ]
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
}

// Test functions
async function testGetQuestionsByChapter(chapterId) {
    console.log(`\n📊 Testing: Get questions by chapter ${chapterId}`);
    
    const result = await makeRequest(`/cau-hoi/phan/${chapterId}`);
    
    if (result.success) {
        console.log(`✅ Success: Found ${result.data.length} questions`);
        
        // Check for duplicates in the response
        const questionIds = result.data.map(q => q.MaCauHoi);
        const uniqueIds = new Set(questionIds);
        
        if (questionIds.length !== uniqueIds.size) {
            console.log(`🚨 DUPLICATE DETECTED: ${questionIds.length} total, ${uniqueIds.size} unique`);
            
            // Find duplicates
            const duplicates = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
            console.log(`   Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
        } else {
            console.log(`✅ No duplicates found in response`);
        }
        
        // Show CLO distribution
        const cloDistribution = {};
        result.data.forEach(q => {
            const clo = q.MaCLO || 'No CLO';
            cloDistribution[clo] = (cloDistribution[clo] || 0) + 1;
        });
        
        console.log(`   CLO Distribution:`, cloDistribution);
        
        return result.data;
    } else {
        console.log(`❌ Failed:`, result.error);
        return [];
    }
}

async function testGetQuestionsByCLO(cloId) {
    console.log(`\n📊 Testing: Get questions by CLO ${cloId}`);
    
    const result = await makeRequest(`/cau-hoi/clo/${cloId}`);
    
    if (result.success) {
        const questions = result.data.data || result.data;
        console.log(`✅ Success: Found ${questions.length} questions`);
        
        // Check for duplicates
        const questionIds = questions.map(q => q.MaCauHoi);
        const uniqueIds = new Set(questionIds);
        
        if (questionIds.length !== uniqueIds.size) {
            console.log(`🚨 DUPLICATE DETECTED: ${questionIds.length} total, ${uniqueIds.size} unique`);
        } else {
            console.log(`✅ No duplicates found in response`);
        }
        
        // Show chapter distribution
        const chapterDistribution = {};
        questions.forEach(q => {
            const chapter = q.MaPhan || 'No Chapter';
            chapterDistribution[chapter] = (chapterDistribution[chapter] || 0) + 1;
        });
        
        console.log(`   Chapter Distribution:`, chapterDistribution);
        
        return questions;
    } else {
        console.log(`❌ Failed:`, result.error);
        return [];
    }
}

async function testExamGeneration() {
    console.log(`\n📊 Testing: Exam generation with CLO matrix`);
    
    const examRequest = {
        tenDeThi: 'Test Exam - CLO Extraction',
        maMonHoc: TEST_CONFIG.maMonHoc,
        nguoiTao: 'test-user',
        soLuongDe: 2,
        matrix: TEST_CONFIG.matrix
    };
    
    const result = await makeRequest('/exam/generate', 'POST', examRequest);
    
    if (result.success) {
        console.log(`✅ Success: Generated exam`);
        console.log(`   Exam IDs: ${result.data.deThiIds?.join(', ') || 'N/A'}`);
        console.log(`   Total questions: ${result.data.totalQuestions || 'N/A'}`);
        
        // If we have exam details, check for duplicates
        if (result.data.examDetails) {
            result.data.examDetails.forEach((exam, index) => {
                console.log(`\n   Exam ${index + 1}:`);
                const questionIds = exam.questions?.map(q => q.MaCauHoi) || [];
                const uniqueIds = new Set(questionIds);
                
                if (questionIds.length !== uniqueIds.size) {
                    console.log(`   🚨 DUPLICATE IN EXAM ${index + 1}: ${questionIds.length} total, ${uniqueIds.size} unique`);
                } else {
                    console.log(`   ✅ No duplicates in exam ${index + 1}`);
                }
                
                console.log(`   Questions: ${questionIds.length}`);
            });
        }
        
        return result.data;
    } else {
        console.log(`❌ Failed:`, result.error);
        return null;
    }
}

async function testCrossChapterQuestionSelection() {
    console.log(`\n📊 Testing: Cross-chapter question selection simulation`);
    
    // Get questions from multiple chapters
    const allQuestions = [];
    
    for (const matrixItem of TEST_CONFIG.matrix) {
        const chapterQuestions = await testGetQuestionsByChapter(matrixItem.maPhan);
        allQuestions.push(...chapterQuestions);
    }
    
    console.log(`\n📋 Cross-chapter analysis:`);
    console.log(`   Total questions from all chapters: ${allQuestions.length}`);
    
    // Check for duplicates across chapters
    const questionIds = allQuestions.map(q => q.MaCauHoi);
    const uniqueIds = new Set(questionIds);
    
    if (questionIds.length !== uniqueIds.size) {
        console.log(`🚨 CROSS-CHAPTER DUPLICATES FOUND:`);
        console.log(`   Total: ${questionIds.length}, Unique: ${uniqueIds.size}`);
        
        // Find which questions are duplicated
        const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
        const uniqueDuplicates = [...new Set(duplicateIds)];
        
        console.log(`   Duplicate question IDs: ${uniqueDuplicates.join(', ')}`);
        
        // Show which chapters have the duplicates
        uniqueDuplicates.forEach(dupId => {
            const chapters = allQuestions
                .filter(q => q.MaCauHoi === dupId)
                .map(q => q.MaPhan);
            console.log(`   Question ${dupId} appears in chapters: ${chapters.join(', ')}`);
        });
        
        return false; // Indicates problem found
    } else {
        console.log(`✅ No cross-chapter duplicates found`);
        return true; // No problems
    }
}

async function runDiagnostics() {
    console.log('🔍 CLO EXTRACTION API DIAGNOSTICS');
    console.log('=' .repeat(50));
    console.log('Author: Linh Dang Dev');
    console.log('Date:', new Date().toISOString());
    
    try {
        // Test 1: Check individual chapter endpoints
        console.log('\n🧪 TEST 1: Individual Chapter Endpoints');
        for (const matrixItem of TEST_CONFIG.matrix) {
            await testGetQuestionsByChapter(matrixItem.maPhan);
        }
        
        // Test 2: Check CLO endpoints
        console.log('\n🧪 TEST 2: CLO Endpoints');
        const cloIds = ['1', '2', '3', '4', '5']; // Adjust based on your CLO IDs
        for (const cloId of cloIds) {
            await testGetQuestionsByCLO(cloId);
        }
        
        // Test 3: Cross-chapter analysis
        console.log('\n🧪 TEST 3: Cross-Chapter Analysis');
        const noCrossChapterDuplicates = await testCrossChapterQuestionSelection();
        
        // Test 4: Full exam generation
        console.log('\n🧪 TEST 4: Full Exam Generation');
        await testExamGeneration();
        
        // Summary
        console.log('\n' + '=' .repeat(50));
        console.log('📋 DIAGNOSTIC SUMMARY:');
        
        if (noCrossChapterDuplicates) {
            console.log('✅ No obvious database-level duplicates found');
            console.log('💡 If API is still returning duplicates, check:');
            console.log('   1. Caching mechanisms');
            console.log('   2. Question selection logic');
            console.log('   3. Database query optimization');
        } else {
            console.log('🚨 DATABASE-LEVEL DUPLICATES DETECTED');
            console.log('💡 Recommended actions:');
            console.log('   1. Run database cleanup script');
            console.log('   2. Check data import processes');
            console.log('   3. Add unique constraints where appropriate');
        }
        
    } catch (error) {
        console.error('\n❌ Diagnostic failed:', error.message);
    }
}

// Helper function to get available test data
async function getAvailableTestData() {
    console.log('\n🔍 Getting available test data...');
    
    // Get subjects
    const subjects = await makeRequest('/mon-hoc');
    if (subjects.success && subjects.data.length > 0) {
        console.log(`📚 Available subjects: ${subjects.data.length}`);
        subjects.data.slice(0, 3).forEach(subject => {
            console.log(`   - ${subject.MaMonHoc}: ${subject.TenMonHoc}`);
        });
        
        // Update test config with first subject
        TEST_CONFIG.maMonHoc = subjects.data[0].MaMonHoc;
    }
    
    // Get chapters for first subject
    if (TEST_CONFIG.maMonHoc) {
        const chapters = await makeRequest(`/phan/mon-hoc/${TEST_CONFIG.maMonHoc}`);
        if (chapters.success && chapters.data.length > 0) {
            console.log(`📖 Available chapters: ${chapters.data.length}`);
            chapters.data.slice(0, 3).forEach(chapter => {
                console.log(`   - ${chapter.MaPhan}: ${chapter.TenPhan}`);
            });
            
            // Update test config with first two chapters
            if (chapters.data.length >= 2) {
                TEST_CONFIG.matrix[0].maPhan = chapters.data[0].MaPhan;
                TEST_CONFIG.matrix[1].maPhan = chapters.data[1].MaPhan;
            }
        }
    }
    
    console.log('\n📋 Updated test configuration:');
    console.log(JSON.stringify(TEST_CONFIG, null, 2));
}

// Main execution
if (require.main === module) {
    (async () => {
        try {
            await getAvailableTestData();
            await runDiagnostics();
            console.log('\n✅ Diagnostics completed!');
        } catch (error) {
            console.error('\n❌ Diagnostics failed:', error);
        }
    })();
}

module.exports = {
    runDiagnostics,
    testGetQuestionsByChapter,
    testGetQuestionsByCLO,
    testExamGeneration,
    testCrossChapterQuestionSelection
};
