const axios = require('axios');
const fs = require('fs');

/**
 * Test Python-based exam export
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000/api';
const REAL_EXAM_ID = 'D5311678-1D22-40A3-8124-D6CDC34512AE'; // TOT NGHIEP 4

async function testPythonExport() {
    console.log('🐍 Testing Python-based Exam Word Export');
    console.log('='.repeat(50));
    console.log(`📋 Real Exam ID: ${REAL_EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    try {
        // Step 1: Check Python environment
        console.log('🔧 Step 1: Checking Python environment...');
        try {
            const envResponse = await axios.get(`${API_BASE_URL}/exam-word-export/templates`);
            console.log('✅ Backend is running');
        } catch (error) {
            console.log('❌ Backend connection failed');
            throw error;
        }

        // Step 2: Test Python export
        console.log('\n🐍 Step 2: Testing Python Word export...');
        const exportOptions = {
            examTitle: 'ĐỀ THI TỐT NGHIỆP 4 - CƠ SỞ DỮ LIỆU (PYTHON)',
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
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/export-python`,
            exportOptions,
            {
                responseType: 'arraybuffer',
                timeout: 60000  // Increased timeout for Python processing
            }
        );

        if (exportResponse.status === 200) {
            console.log('✅ Python export successful');
            console.log(`   File size: ${exportResponse.data.length} bytes`);
            
            // Save file
            const filename = `TOT_NGHIEP_4_Python_${Date.now()}.docx`;
            fs.writeFileSync(filename, exportResponse.data);
            console.log(`   File saved: ${filename}`);
        }

        // Step 3: Test Python export with answers
        console.log('\n📋 Step 3: Testing Python export with answers...');
        const exportWithAnswers = {
            ...exportOptions,
            examTitle: 'ĐỀ THI TỐT NGHIỆP 4 - CƠ SỞ DỮ LIỆU (PYTHON + ĐÁP ÁN)',
            showAnswers: true,
            separateAnswerSheet: true,
            studentInfo: {
                studentId: 'SV2024001',
                studentName: 'Nguyễn Văn A',
                className: 'CNTT2024'
            }
        };

        const answersResponse = await axios.post(
            `${API_BASE_URL}/exam-word-export/${REAL_EXAM_ID}/export-python`,
            exportWithAnswers,
            {
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        if (answersResponse.status === 200) {
            console.log('✅ Python export with answers successful');
            console.log(`   File size: ${answersResponse.data.length} bytes`);
            
            // Save file
            const answersFilename = `TOT_NGHIEP_4_Python_WithAnswers_${Date.now()}.docx`;
            fs.writeFileSync(answersFilename, answersResponse.data);
            console.log(`   File saved: ${answersFilename}`);
        }

        // Summary
        console.log('\n🎉 Python Export Test Results');
        console.log('='.repeat(50));
        console.log('✅ Step 1: Backend connection successful');
        console.log('✅ Step 2: Python Word export successful');
        console.log('✅ Step 3: Python export with answers successful');
        console.log();
        console.log('🎯 All Python tests passed!');
        console.log();
        console.log('📁 Generated files:');
        console.log('   - Basic Python export: TOT_NGHIEP_4_Python_*.docx');
        console.log('   - With answers: TOT_NGHIEP_4_Python_WithAnswers_*.docx');
        console.log();
        console.log('💡 Python export advantages:');
        console.log('   - Better Word formatting');
        console.log('   - More flexible layout control');
        console.log('   - Easier to customize');
        console.log('   - Better handling of Vietnamese text');
        console.log();
        console.log('🔧 Frontend integration:');
        console.log('   - Update API endpoint to: /export-python');
        console.log('   - Same request format as before');
        console.log('   - Better output quality');

    } catch (error) {
        console.error('\n❌ Python export test failed:');
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
        console.log('   1. Install Python packages: pip install python-docx pyodbc');
        console.log('   2. Ensure Python 3 is available as "python3"');
        console.log('   3. Check database connection (Windows Auth)');
        console.log('   4. Verify exam ID exists and is approved');
        console.log('   5. Check backend logs for Python script errors');
    }
}

// Run Python export test
testPythonExport();
