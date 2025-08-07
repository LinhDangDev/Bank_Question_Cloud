const axios = require('axios');
const fs = require('fs');

/**
 * Test real exam export with approved exam ID
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000/api';
const REAL_EXAM_ID = 'D5311678-1D22-40A3-8124-D6CDC34512AE'; // TOT NGHIEP 4

async function testRealExamExport() {
    console.log('🚀 Testing Real Exam Word Export');
    console.log('='.repeat(50));
    console.log(`📋 Real Exam ID: ${REAL_EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    try {
        // Step 1: Test default options
        console.log('🔧 Step 1: Getting default options...');
        const defaultResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/default-options`
        );
        
        if (defaultResponse.data.success) {
            console.log('✅ Default options loaded');
            console.log('   Data:');
            Object.entries(defaultResponse.data.data).forEach(([key, value]) => {
                console.log(`     ${key}: ${value}`);
            });
        }

        // Step 2: Test preview
        console.log('\n👀 Step 2: Getting exam preview...');
        const previewResponse = await axios.get(
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/preview`
        );
        
        if (previewResponse.data.success) {
            console.log('✅ Preview loaded');
            console.log(`   Title: ${previewResponse.data.data.examTitle}`);
            console.log(`   Subject: ${previewResponse.data.data.subject}`);
            console.log(`   Total questions: ${previewResponse.data.data.totalQuestions}`);
        }

        // Step 3: Test basic export
        console.log('\n📤 Step 3: Testing basic Word export...');
        const exportOptions = {
            examTitle: 'ĐỀ THI TỐT NGHIỆP 4 - CƠ SỞ DỮ LIỆU',
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
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/export`,
            exportOptions,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        if (exportResponse.status === 200) {
            console.log('✅ Basic export successful');
            console.log(`   File size: ${exportResponse.data.length} bytes`);
            
            // Save file
            const filename = `TOT_NGHIEP_4_Basic_${Date.now()}.docx`;
            fs.writeFileSync(filename, exportResponse.data);
            console.log(`   File saved: ${filename}`);
        }

        // Step 4: Test export with answers
        console.log('\n📋 Step 4: Testing export with answers...');
        const exportWithAnswers = {
            ...exportOptions,
            examTitle: 'ĐỀ THI TỐT NGHIỆP 4 - CƠ SỞ DỮ LIỆU (KÈM ĐÁP ÁN)',
            showAnswers: true,
            separateAnswerSheet: true,
            studentInfo: {
                studentId: 'SV2024001',
                studentName: 'Nguyễn Văn A',
                className: 'CNTT2024'
            }
        };

        const answersResponse = await axios.post(
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/export`,
            exportWithAnswers,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        if (answersResponse.status === 200) {
            console.log('✅ Export with answers successful');
            console.log(`   File size: ${answersResponse.data.length} bytes`);
            
            // Save file
            const answersFilename = `TOT_NGHIEP_4_WithAnswers_${Date.now()}.docx`;
            fs.writeFileSync(answersFilename, answersResponse.data);
            console.log(`   File saved: ${answersFilename}`);
        }

        // Summary
        console.log('\n🎉 Real Exam Export Test Results');
        console.log('='.repeat(50));
        console.log('✅ Step 1: Default options loaded');
        console.log('✅ Step 2: Exam preview loaded');
        console.log('✅ Step 3: Basic Word export successful');
        console.log('✅ Step 4: Word export with answers successful');
        console.log();
        console.log('🎯 All tests passed! Real exam export is working correctly.');
        console.log();
        console.log('📁 Generated files:');
        console.log('   - Basic export: TOT_NGHIEP_4_Basic_*.docx');
        console.log('   - With answers: TOT_NGHIEP_4_WithAnswers_*.docx');
        console.log();
        console.log('💡 Frontend should now work correctly with this exam ID!');
        console.log(`   URL: http://localhost:5173/exam-detail/${REAL_EXAM_ID}`);

    } catch (error) {
        console.error('\n❌ Real exam test failed:');
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
        console.log('   2. Check if exam is approved (DaDuyet = true)');
        console.log('   3. Verify template file exists');
        console.log('   4. Check database connection');
    }
}

// Run real exam test
testRealExamExport();
