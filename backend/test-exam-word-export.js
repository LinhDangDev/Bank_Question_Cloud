const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Test script for Exam Word Export API
 * Author: Linh Dang Dev
 */

const API_BASE_URL = 'http://localhost:3000';
const TEST_EXAM_ID = '6A429A3A-97AB-4043-8F8A-476BEDB7476B'; // Replace with actual exam ID

async function testGetDefaultOptions() {
    console.log('🔍 Testing: Get Default Export Options');
    console.log('-'.repeat(50));

    try {
        const response = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/default-options`
        );

        console.log('✅ Success!');
        console.log('📋 Default Options:');
        console.log(JSON.stringify(response.data.data, null, 2));
        
        return response.data.data;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testPreviewExam() {
    console.log('\n🔍 Testing: Preview Exam Data');
    console.log('-'.repeat(50));

    try {
        const response = await axios.get(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/preview`
        );

        console.log('✅ Success!');
        console.log('📋 Exam Preview:');
        console.log(`   Title: ${response.data.data.examTitle}`);
        console.log(`   Subject: ${response.data.data.subject}`);
        console.log(`   Total Questions: ${response.data.data.totalQuestions}`);
        console.log('   Sample Questions:');
        
        response.data.data.questions.forEach((q, i) => {
            console.log(`     ${i + 1}. ${q.content}`);
            console.log(`        Answers: ${q.answerCount}`);
        });

        if (response.data.data.hasMoreQuestions) {
            console.log('     ... and more questions');
        }

        return response.data.data;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testExportBasic() {
    console.log('\n📤 Testing: Basic Word Export');
    console.log('-'.repeat(50));

    try {
        const exportData = {
            examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU',
            subject: 'Cơ sở dữ liệu',
            course: 'Khoa CNTT',
            semester: 'Học kỳ 1',
            academicYear: '2024-2025',
            examDate: '15/12/2024',
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

        console.log('📋 Export Options:');
        console.log(JSON.stringify(exportData, null, 2));

        const response = await axios.post(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/export`,
            exportData,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        // Save the file
        const filename = `test_exam_basic_${Date.now()}.docx`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, response.data);

        console.log('✅ Success!');
        console.log(`📁 File saved: ${filepath}`);
        console.log(`📊 File size: ${response.data.length} bytes`);

        return filepath;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testExportWithAnswers() {
    console.log('\n📤 Testing: Word Export with Answers');
    console.log('-'.repeat(50));

    try {
        const exportData = {
            examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU (KÈM ĐÁP ÁN)',
            subject: 'Cơ sở dữ liệu',
            course: 'Khoa CNTT',
            semester: 'Học kỳ 1',
            academicYear: '2024-2025',
            examDate: '15/12/2024',
            duration: '90 phút',
            instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            allowMaterials: false,
            showAnswers: true,
            separateAnswerSheet: true,
            studentInfo: {
                studentId: 'SV001',
                studentName: 'Nguyễn Văn A',
                className: 'CNTT01'
            }
        };

        console.log('📋 Export Options (with answers):');
        console.log(JSON.stringify(exportData, null, 2));

        const response = await axios.post(
            `${API_BASE_URL}/exam-word-export/${TEST_EXAM_ID}/export`,
            exportData,
            {
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        // Save the file
        const filename = `test_exam_with_answers_${Date.now()}.docx`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, response.data);

        console.log('✅ Success!');
        console.log(`📁 File saved: ${filepath}`);
        console.log(`📊 File size: ${response.data.length} bytes`);

        return filepath;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testGetTemplates() {
    console.log('\n🔍 Testing: Get Available Templates');
    console.log('-'.repeat(50));

    try {
        const response = await axios.get(
            `${API_BASE_URL}/exam-word-export/templates`
        );

        console.log('✅ Success!');
        console.log('📋 Available Templates:');
        
        response.data.data.templates.forEach((template, i) => {
            console.log(`   ${i + 1}. ${template.name}`);
            console.log(`      ID: ${template.id}`);
            console.log(`      Description: ${template.description}`);
            console.log(`      Features: ${template.features.join(', ')}`);
            console.log();
        });

        return response.data.data;

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('🚀 Testing Exam Word Export API');
    console.log('='.repeat(60));
    console.log(`📋 Test Exam ID: ${TEST_EXAM_ID}`);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log();

    // Test 1: Get default options
    const defaultOptions = await testGetDefaultOptions();
    
    // Test 2: Preview exam
    const previewData = await testPreviewExam();
    
    // Test 3: Get templates
    const templates = await testGetTemplates();
    
    // Test 4: Basic export
    const basicFile = await testExportBasic();
    
    // Test 5: Export with answers
    const answersFile = await testExportWithAnswers();

    // Summary
    console.log('\n🎉 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Default Options: ${defaultOptions ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Preview Data: ${previewData ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Templates: ${templates ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Basic Export: ${basicFile ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Export with Answers: ${answersFile ? 'PASS' : 'FAIL'}`);

    if (basicFile || answersFile) {
        console.log('\n📁 Generated Files:');
        if (basicFile) console.log(`   - ${basicFile}`);
        if (answersFile) console.log(`   - ${answersFile}`);
        console.log('\n💡 Open these files in Microsoft Word to verify the output!');
    }
}

// Run tests
runAllTests().catch(console.error);
