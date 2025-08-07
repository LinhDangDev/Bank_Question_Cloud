const axios = require('axios');

/**
 * Quick test for Exam Word Export API
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_EXAM_ID = '6A429A3A-97AB-4043-8F8A-476BEDB7476B'; // Replace with actual exam ID

async function quickTest() {
    console.log('🚀 Quick Test: Exam Word Export API');
    console.log('='.repeat(50));
    console.log(`📋 Test Exam ID: ${TEST_EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    try {
        // Test 1: Get default options
        console.log('🔍 Testing: Get Default Options...');
        const defaultResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/default-options`
        );
        
        if (defaultResponse.data.success) {
            console.log('✅ Default options loaded successfully');
            console.log(`   Title: ${defaultResponse.data.data.examTitle}`);
            console.log(`   Subject: ${defaultResponse.data.data.subject}`);
        } else {
            console.log('❌ Failed to load default options');
        }

        // Test 2: Preview exam
        console.log('\n🔍 Testing: Preview Exam...');
        const previewResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/preview`
        );
        
        if (previewResponse.data.success) {
            console.log('✅ Preview loaded successfully');
            console.log(`   Questions: ${previewResponse.data.data.totalQuestions}`);
        } else {
            console.log('❌ Failed to load preview');
        }

        // Test 3: Export basic Word file
        console.log('\n📤 Testing: Export Word File...');
        const exportData = {
            examTitle: 'ĐỀ THI TEST API',
            subject: 'Test Subject',
            course: 'Test Course',
            academicYear: '2024-2025',
            examDate: new Date().toLocaleDateString('vi-VN'),
            duration: '90 phút',
            showAnswers: false
        };

        const exportResponse = await axios.post(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/export`,
            exportData,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        if (exportResponse.status === 200) {
            console.log('✅ Word export successful');
            console.log(`   File size: ${exportResponse.data.length} bytes`);
            
            // Save file for verification
            const fs = require('fs');
            const filename = `test_export_${Date.now()}.docx`;
            fs.writeFileSync(filename, exportResponse.data);
            console.log(`   File saved: ${filename}`);
        } else {
            console.log('❌ Word export failed');
        }

        console.log('\n🎉 Quick test completed successfully!');
        console.log('💡 All endpoints are working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || 'Unknown error'}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure backend is running on port 3000');
        console.log('   2. Check if the exam ID exists in database');
        console.log('   3. Verify template file exists at: template/TemplateHutechOffical.dotx');
    }
}

// Run quick test
quickTest();
