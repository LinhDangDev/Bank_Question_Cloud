const axios = require('axios');
const fs = require('fs');

/**
 * Debug script for exam export
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000/api';
const EXAM_ID = 'D5311678-1D22-40A3-8124-D6CDC34512AE';

async function testExportDebug() {
    console.log('🔧 Testing Exam Export Debug');
    console.log('='.repeat(50));
    console.log(`📋 Exam ID: ${EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    try {
        const exportOptions = {
            examTitle: 'ĐỀ THI DEBUG TEST',
            subject: 'Cơ sở dữ liệu',
            course: 'Khoa CNTT',
            semester: 'Học kỳ 1',
            academicYear: '2024-2025',
            examDate: new Date().toLocaleDateString('vi-VN'),
            duration: '90 phút',
            instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            allowMaterials: false,
            showAnswers: false,
            separateAnswerSheet: false,
            studentInfo: {
                studentId: '',
                studentName: '',
                className: ''
            }
        };

        console.log('📋 Export options:');
        console.log(JSON.stringify(exportOptions, null, 2));
        console.log();

        console.log('🚀 Sending request...');
        const startTime = Date.now();

        const response = await axios.post(
            `${API_BASE_URL}/exam-word-export/${EXAM_ID}/export`,
            exportOptions,
            {
                responseType: 'arraybuffer',
                timeout: 60000,
                validateStatus: function (status) {
                    return status < 500; // Accept any status less than 500
                }
            }
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️  Request completed in ${duration}ms`);
        console.log(`📡 Response status: ${response.status}`);
        console.log(`📡 Response headers:`, response.headers);
        console.log(`📁 Response data size: ${response.data.length} bytes`);

        if (response.status === 200) {
            console.log('✅ Export successful!');
            
            // Save file
            const filename = `debug_export_${Date.now()}.docx`;
            fs.writeFileSync(filename, response.data);
            console.log(`💾 File saved: ${filename}`);
            
            // Check file size
            const stats = fs.statSync(filename);
            console.log(`📊 File size: ${stats.size} bytes`);
            
            if (stats.size > 1000) {
                console.log('🎉 File seems valid (size > 1KB)');
            } else {
                console.log('⚠️  File seems too small, might be an error response');
                
                // Try to read as text to see error
                try {
                    const content = fs.readFileSync(filename, 'utf8');
                    console.log('📄 File content:', content);
                } catch (e) {
                    console.log('📄 File is binary (good sign)');
                }
            }
        } else {
            console.log('❌ Export failed!');
            
            // Try to parse error response
            try {
                const errorText = Buffer.from(response.data).toString('utf8');
                console.log('📄 Error response:', errorText);
            } catch (e) {
                console.log('📄 Could not parse error response');
            }
        }

    } catch (error) {
        console.error('💥 Request failed:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Headers:`, error.response.headers);
            
            try {
                const errorText = Buffer.from(error.response.data).toString('utf8');
                console.error(`   Response: ${errorText}`);
            } catch (e) {
                console.error(`   Response: [Binary data, ${error.response.data.length} bytes]`);
            }
        } else if (error.request) {
            console.error('   No response received');
            console.error('   Request:', error.request);
        } else {
            console.error('   Error:', error.message);
        }
    }
}

// Run the test
testExportDebug();
