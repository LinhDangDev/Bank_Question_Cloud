const axios = require('axios');
const fs = require('fs');

/**
 * Test complete flow for Exam Word Export
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_EXAM_ID = '6A429A3A-97AB-4043-8F8A-476BEDB7476B'; // Replace with actual exam ID

async function testCompleteFlow() {
    console.log('🚀 Testing Complete Exam Word Export Flow');
    console.log('='.repeat(60));
    console.log(`📋 Test Exam ID: ${TEST_EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    try {
        // Step 1: Get exam details (simulate frontend loading exam page)
        console.log('📖 Step 1: Loading exam details...');
        const examResponse = await axios.get(`${API_BASE_URL}/de-thi/${TEST_EXAM_ID}`);
        
        if (examResponse.data) {
            console.log('✅ Exam loaded successfully');
            console.log(`   Title: ${examResponse.data.TenDeThi}`);
            console.log(`   Subject: ${examResponse.data.MonHoc?.TenMonHoc || 'N/A'}`);
        }

        // Step 2: User clicks "Tải Word" button - Get default options
        console.log('\n🔧 Step 2: Getting default export options...');
        const defaultResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/default-options`
        );
        
        if (defaultResponse.data.success) {
            console.log('✅ Default options loaded');
            console.log('   Default data:');
            Object.entries(defaultResponse.data.data).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
            });
        }

        // Step 3: Preview exam data
        console.log('\n👀 Step 3: Loading exam preview...');
        const previewResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/preview`
        );
        
        if (previewResponse.data.success) {
            console.log('✅ Preview loaded');
            console.log(`   Total questions: ${previewResponse.data.data.totalQuestions}`);
            console.log('   Sample questions:');
            previewResponse.data.data.questions.forEach((q, i) => {
                console.log(`     ${i + 1}. ${q.content.substring(0, 50)}...`);
            });
        }

        // Step 4: User fills form and exports (simulate form submission)
        console.log('\n📤 Step 4: Exporting Word document...');
        const exportOptions = {
            examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU',
            subject: 'Cơ sở dữ liệu',
            course: 'Khoa Công nghệ Thông tin',
            semester: 'Học kỳ 1',
            academicYear: '2024-2025',
            examDate: new Date().toLocaleDateString('vi-VN'),
            duration: '90 phút',
            instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu. Sinh viên làm bài trên giấy thi.',
            allowMaterials: false,
            showAnswers: false,
            separateAnswerSheet: false,
            studentInfo: {
                studentId: '',
                studentName: '',
                className: ''
            }
        };

        console.log('   Export options:');
        Object.entries(exportOptions).forEach(([key, value]) => {
            if (typeof value === 'object') {
                console.log(`     ${key}: ${JSON.stringify(value)}`);
            } else {
                console.log(`     ${key}: ${value}`);
            }
        });

        const exportResponse = await axios.post(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/export`,
            exportOptions,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        if (exportResponse.status === 200) {
            console.log('✅ Word export successful');
            console.log(`   File size: ${exportResponse.data.length} bytes`);
            
            // Save file
            const filename = `test_complete_flow_${Date.now()}.docx`;
            fs.writeFileSync(filename, exportResponse.data);
            console.log(`   File saved: ${filename}`);
        }

        // Step 5: Test with answers
        console.log('\n📋 Step 5: Exporting with answers...');
        const exportWithAnswers = {
            ...exportOptions,
            examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU (KÈM ĐÁP ÁN)',
            showAnswers: true,
            separateAnswerSheet: true,
            studentInfo: {
                studentId: 'SV001',
                studentName: 'Nguyễn Văn A',
                className: 'CNTT01'
            }
        };

        const answersResponse = await axios.post(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/export`,
            exportWithAnswers,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        if (answersResponse.status === 200) {
            console.log('✅ Word export with answers successful');
            console.log(`   File size: ${answersResponse.data.length} bytes`);
            
            // Save file
            const answersFilename = `test_with_answers_${Date.now()}.docx`;
            fs.writeFileSync(answersFilename, answersResponse.data);
            console.log(`   File saved: ${answersFilename}`);
        }

        // Summary
        console.log('\n🎉 Complete Flow Test Results');
        console.log('='.repeat(60));
        console.log('✅ Step 1: Exam details loaded');
        console.log('✅ Step 2: Default options retrieved');
        console.log('✅ Step 3: Exam preview loaded');
        console.log('✅ Step 4: Basic Word export successful');
        console.log('✅ Step 5: Word export with answers successful');
        console.log();
        console.log('🎯 All tests passed! The complete flow is working correctly.');
        console.log();
        console.log('📁 Generated files:');
        console.log('   - Basic export: test_complete_flow_*.docx');
        console.log('   - With answers: test_with_answers_*.docx');
        console.log();
        console.log('💡 Frontend Integration:');
        console.log('   1. User visits exam detail page');
        console.log('   2. Clicks "Tải Word" button');
        console.log('   3. Dialog opens with pre-filled form');
        console.log('   4. User customizes options');
        console.log('   5. Clicks "Xuất file Word"');
        console.log('   6. File downloads automatically');

    } catch (error) {
        console.error('\n❌ Flow test failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || 'Unknown error'}`);
            if (error.response.data?.error) {
                console.error(`   Error: ${error.response.data.error}`);
            }
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Ensure backend is running on port 3000');
        console.log('   2. Check if exam ID exists and is approved');
        console.log('   3. Verify template file: template/TemplateHutechOffical.dotx');
        console.log('   4. Check database connection');
        console.log('   5. Verify all required entities exist');
    }
}

// Run complete flow test
testCompleteFlow();
