/**
 * Performance Test Script for Exam Generation API
 * Author: Linh Dang Dev
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_CONFIG = {
    // Test matrix - adjust based on your database
    matrix: [
        {
            maPhan: 'your-chapter-1-id', // Replace with actual chapter ID
            clo1: 2,
            clo2: 1,
            clo3: 1,
            clo4: 0,
            clo5: 0
        },
        {
            maPhan: 'your-chapter-2-id', // Replace with actual chapter ID
            clo1: 1,
            clo2: 2,
            clo3: 0,
            clo4: 1,
            clo5: 0
        }
    ],
    maMonHoc: 'your-subject-id' // Replace with actual subject ID
};

// Performance metrics
const metrics = {
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    timeouts: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errors: []
};

async function makeTimedRequest(endpoint, method = 'POST', data = null) {
    const startTime = Date.now();
    
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 70000 // 70 seconds timeout
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        return {
            success: true,
            duration,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        
        return {
            success: false,
            duration,
            error: error.response?.data || error.message,
            status: error.response?.status || 0,
            isTimeout
        };
    }
}

async function testSingleExamGeneration(testNumber) {
    console.log(`\n🧪 Test ${testNumber}: Single Exam Generation`);
    
    const examRequest = {
        tenDeThi: `Performance Test ${testNumber} - ${new Date().toISOString()}`,
        maMonHoc: TEST_CONFIG.maMonHoc,
        nguoiTao: 'performance-test',
        matrix: TEST_CONFIG.matrix
    };
    
    const result = await makeTimedRequest('/de-thi/generate-with-clo', 'POST', examRequest);
    
    metrics.totalTests++;
    metrics.totalTime += result.duration;
    metrics.minTime = Math.min(metrics.minTime, result.duration);
    metrics.maxTime = Math.max(metrics.maxTime, result.duration);
    
    if (result.success) {
        metrics.successfulTests++;
        console.log(`✅ Success in ${result.duration}ms`);
        console.log(`   Questions: ${result.data.totalQuestions || 'N/A'}`);
        return true;
    } else {
        metrics.failedTests++;
        if (result.isTimeout) {
            metrics.timeouts++;
            console.log(`⏰ TIMEOUT after ${result.duration}ms`);
        } else {
            console.log(`❌ Failed in ${result.duration}ms: ${result.error}`);
        }
        metrics.errors.push({
            test: testNumber,
            error: result.error,
            duration: result.duration,
            isTimeout: result.isTimeout
        });
        return false;
    }
}

async function testMultipleExamGeneration(testNumber) {
    console.log(`\n🧪 Test ${testNumber}: Multiple Exam Generation (3 exams)`);
    
    const examRequest = {
        tenDeThi: `Performance Test Multiple ${testNumber}`,
        maMonHoc: TEST_CONFIG.maMonHoc,
        nguoiTao: 'performance-test',
        soLuongDe: 3,
        matrix: TEST_CONFIG.matrix
    };
    
    const result = await makeTimedRequest('/de-thi/generate', 'POST', examRequest);
    
    metrics.totalTests++;
    metrics.totalTime += result.duration;
    metrics.minTime = Math.min(metrics.minTime, result.duration);
    metrics.maxTime = Math.max(metrics.maxTime, result.duration);
    
    if (result.success) {
        metrics.successfulTests++;
        console.log(`✅ Success in ${result.duration}ms`);
        console.log(`   Exams generated: ${result.data.deThiIds?.length || 'N/A'}`);
        return true;
    } else {
        metrics.failedTests++;
        if (result.isTimeout) {
            metrics.timeouts++;
            console.log(`⏰ TIMEOUT after ${result.duration}ms`);
        } else {
            console.log(`❌ Failed in ${result.duration}ms: ${result.error}`);
        }
        metrics.errors.push({
            test: testNumber,
            error: result.error,
            duration: result.duration,
            isTimeout: result.isTimeout
        });
        return false;
    }
}

async function getAvailableTestData() {
    console.log('\n🔍 Getting available test data...');
    
    try {
        // Get subjects
        const subjects = await makeTimedRequest('/mon-hoc', 'GET');
        if (subjects.success && subjects.data.length > 0) {
            console.log(`📚 Found ${subjects.data.length} subjects`);
            TEST_CONFIG.maMonHoc = subjects.data[0].MaMonHoc;
            console.log(`   Using subject: ${subjects.data[0].TenMonHoc}`);
        }
        
        // Get chapters for first subject
        if (TEST_CONFIG.maMonHoc) {
            const chapters = await makeTimedRequest(`/phan/mon-hoc/${TEST_CONFIG.maMonHoc}`, 'GET');
            if (chapters.success && chapters.data.length > 0) {
                console.log(`📖 Found ${chapters.data.length} chapters`);
                
                // Update test config with first two chapters
                if (chapters.data.length >= 2) {
                    TEST_CONFIG.matrix[0].maPhan = chapters.data[0].MaPhan;
                    TEST_CONFIG.matrix[1].maPhan = chapters.data[1].MaPhan;
                    console.log(`   Using chapters: ${chapters.data[0].TenPhan}, ${chapters.data[1].TenPhan}`);
                } else if (chapters.data.length >= 1) {
                    TEST_CONFIG.matrix[0].maPhan = chapters.data[0].MaPhan;
                    TEST_CONFIG.matrix = [TEST_CONFIG.matrix[0]]; // Use only one chapter
                    console.log(`   Using chapter: ${chapters.data[0].TenPhan}`);
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to get test data:', error.message);
        return false;
    }
}

function printMetrics() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Tests: ${metrics.totalTests}`);
    console.log(`   Successful: ${metrics.successfulTests} (${((metrics.successfulTests / metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`   Timeouts: ${metrics.timeouts} (${((metrics.timeouts / metrics.totalTests) * 100).toFixed(1)}%)`);
    
    if (metrics.totalTests > 0) {
        console.log(`\n⏱️ Timing Statistics:`);
        console.log(`   Average Time: ${(metrics.totalTime / metrics.totalTests).toFixed(0)}ms`);
        console.log(`   Min Time: ${metrics.minTime}ms`);
        console.log(`   Max Time: ${metrics.maxTime}ms`);
        
        // Performance assessment
        const avgTime = metrics.totalTime / metrics.totalTests;
        const successRate = (metrics.successfulTests / metrics.totalTests) * 100;
        
        console.log(`\n🎯 Performance Assessment:`);
        if (avgTime < 5000 && successRate > 90) {
            console.log(`   ✅ EXCELLENT - Fast and reliable`);
        } else if (avgTime < 10000 && successRate > 80) {
            console.log(`   ✅ GOOD - Acceptable performance`);
        } else if (avgTime < 20000 && successRate > 70) {
            console.log(`   ⚠️ FAIR - Needs optimization`);
        } else {
            console.log(`   ❌ POOR - Requires immediate attention`);
        }
        
        if (metrics.timeouts > 0) {
            console.log(`   🚨 ${metrics.timeouts} timeout(s) detected - API performance issues`);
        }
    }
    
    if (metrics.errors.length > 0) {
        console.log(`\n❌ Error Details:`);
        metrics.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. Test ${error.test}: ${error.isTimeout ? 'TIMEOUT' : error.error}`);
            console.log(`      Duration: ${error.duration}ms`);
        });
    }
    
    console.log(`\n💡 Recommendations:`);
    if (metrics.timeouts > 0) {
        console.log(`   - Database queries are too slow - check indexes`);
        console.log(`   - Consider implementing query optimization`);
        console.log(`   - Review recently used questions caching`);
    }
    if (metrics.failedTests > 0) {
        console.log(`   - Check database connection stability`);
        console.log(`   - Review error logs for specific issues`);
        console.log(`   - Ensure sufficient test data in database`);
    }
    if (metrics.successfulTests === metrics.totalTests) {
        console.log(`   - Performance is stable, consider load testing`);
    }
}

async function runPerformanceTests() {
    console.log('🚀 EXAM GENERATION PERFORMANCE TEST');
    console.log('Author: Linh Dang Dev');
    console.log('Date:', new Date().toISOString());
    console.log('=' .repeat(60));
    
    try {
        // Get test data
        const hasTestData = await getAvailableTestData();
        if (!hasTestData) {
            console.log('❌ Cannot proceed without test data');
            return;
        }
        
        console.log('\n📋 Test Configuration:');
        console.log(JSON.stringify(TEST_CONFIG, null, 2));
        
        // Run tests
        console.log('\n🧪 Starting Performance Tests...');
        
        // Test 1-3: Single exam generation
        for (let i = 1; i <= 3; i++) {
            await testSingleExamGeneration(i);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
        // Test 4-5: Multiple exam generation
        for (let i = 4; i <= 5; i++) {
            await testMultipleExamGeneration(i);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        // Print results
        printMetrics();
        
    } catch (error) {
        console.error('\n❌ Performance test failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runPerformanceTests()
        .then(() => {
            console.log('\n✅ Performance tests completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Performance tests failed:', error);
            process.exit(1);
        });
}

module.exports = { runPerformanceTests, testSingleExamGeneration, testMultipleExamGeneration };
