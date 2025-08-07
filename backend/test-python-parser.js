const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Test script for Python Enhanced DOCX Parser API
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_FILE_PATH = path.join(__dirname, '..', 'template', 'TOT NGHIEP.docx');

async function testPythonParser() {
    console.log('🚀 Testing Python Enhanced DOCX Parser API');
    console.log('=' * 50);

    try {
        // Check if test file exists
        if (!fs.existsSync(TEST_FILE_PATH)) {
            console.error(`❌ Test file not found: ${TEST_FILE_PATH}`);
            return;
        }

        console.log(`📁 Using test file: ${TEST_FILE_PATH}`);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(TEST_FILE_PATH));
        formData.append('processImages', 'true');
        formData.append('extractStyles', 'true');
        formData.append('preserveLatex', 'true');
        formData.append('maxQuestions', '50');

        console.log('📤 Uploading file to Python parser...');

        // Test the Python enhanced parser endpoint
        const response = await axios.post(
            `${API_BASE_URL}/python-enhanced-docx-parser/upload`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 60000, // 60 seconds timeout
            }
        );

        console.log('✅ Response received!');
        console.log('📊 Results:');
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Message: ${response.data.message}`);
        
        if (response.data.data) {
            const { questions, stats } = response.data.data;
            console.log(`   Questions found: ${questions.length}`);
            console.log('   Statistics:');
            console.log(`     - Total: ${stats.totalQuestions}`);
            console.log(`     - Single choice: ${stats.singleQuestions}`);
            console.log(`     - Group: ${stats.groupQuestions}`);
            console.log(`     - Fill-in-blank: ${stats.fillInBlankQuestions}`);
            console.log(`     - With LaTeX: ${stats.hasLatex}`);
            console.log(`     - Correct answers found: ${stats.correctAnswersFound}`);

            // Show sample questions
            if (questions.length > 0) {
                console.log('\n📖 Sample Questions:');
                questions.slice(0, 3).forEach((q, i) => {
                    console.log(`\n   Question ${i + 1}:`);
                    console.log(`     Type: ${q.type}`);
                    console.log(`     CLO: ${q.clo || 'N/A'}`);
                    console.log(`     Content: ${q.content.substring(0, 100)}...`);
                    console.log(`     Answers: ${q.answers?.length || 0}`);
                    
                    if (q.answers && q.answers.length > 0) {
                        q.answers.forEach((a, j) => {
                            const correct = a.isCorrect ? ' ✓' : '';
                            console.log(`       ${String.fromCharCode(65 + j)}. ${a.content.substring(0, 50)}...${correct}`);
                        });
                    }
                });
            }
        }

        if (response.data.errors && response.data.errors.length > 0) {
            console.log('\n⚠️ Errors:');
            response.data.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

async function testQuestionImportWithPython() {
    console.log('\n🚀 Testing Questions Import with Python Parser');
    console.log('=' * 50);

    try {
        // Create form data for questions import
        const formData = new FormData();
        formData.append('file', fs.createReadStream(TEST_FILE_PATH));
        formData.append('processImages', 'true');
        formData.append('limit', '20');

        console.log('📤 Uploading to questions import with Python parser...');

        // Test the questions import with Python parser
        const response = await axios.post(
            `${API_BASE_URL}/questions-import/upload-python`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    // Add auth header if needed
                    // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
                },
                timeout: 60000,
            }
        );

        console.log('✅ Questions import response received!');
        console.log(`   File ID: ${response.data.fileId}`);
        console.log(`   Questions count: ${response.data.count}`);

        // Test preview endpoint
        if (response.data.fileId) {
            console.log('\n📋 Testing preview endpoint...');
            
            const previewResponse = await axios.get(
                `${API_BASE_URL}/questions-import/preview/${response.data.fileId}?page=1&limit=5`,
                {
                    headers: {
                        // Add auth header if needed
                        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
                    }
                }
            );

            console.log('✅ Preview response received!');
            console.log(`   Items: ${previewResponse.data.items.length}`);
            console.log(`   Total: ${previewResponse.data.meta.total}`);
        }

    } catch (error) {
        console.error('❌ Questions import test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

// Run tests
async function runAllTests() {
    await testPythonParser();
    await testQuestionImportWithPython();
    console.log('\n🎉 All tests completed!');
}

runAllTests().catch(console.error);
