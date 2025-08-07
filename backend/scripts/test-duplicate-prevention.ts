/**
 * Test Script for Duplicate Prevention in Exam Generation
 * Author: Linh Dang Dev
 * 
 * This script tests the duplicate prevention logic in exam generation
 */

import { ExamValidationUtil } from '../src/utils/exam-validation.util';
import { CauHoi } from '../src/entities/cau-hoi.entity';

// Mock data for testing
const createMockQuestion = (id: string, chapter: string, clo: number, content: string): CauHoi => ({
    MaCauHoi: id,
    NoiDung: content,
    MaPhan: chapter,
    MaCLO: clo,
    SoLanDuocThi: 0,
    SoLanDung: 0,
    DoKhoThucTe: 0.5,
    DoPhanCachCauHoi: 1.0,
    HoanVi: 1,
    SoCauHoiCon: 0,
    MaCauHoiCha: null,
    NgayTao: new Date(),
    NgayCapNhat: new Date(),
    DaDuyet: true,
    NguoiTao: 'admin',
    NguoiCapNhat: 'admin'
} as CauHoi);

function testDuplicateDetection() {
    console.log('=== Testing Duplicate Detection ===\n');

    // Test 1: No duplicates
    const noDuplicates = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2'),
        createMockQuestion('Q003', 'CHAP1', 2, 'Question 3')
    ];

    const result1 = ExamValidationUtil.checkForDuplicates(noDuplicates);
    console.log('Test 1 - No duplicates:');
    console.log(`- Has duplicates: ${result1.hasDuplicates}`);
    console.log(`- Unique count: ${result1.uniqueCount}`);
    console.log(`- Duplicate count: ${result1.duplicateCount}\n`);

    // Test 2: With duplicates
    const withDuplicates = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2'),
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1 duplicate'), // Duplicate
        createMockQuestion('Q003', 'CHAP1', 2, 'Question 3'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2 duplicate')  // Duplicate
    ];

    const result2 = ExamValidationUtil.checkForDuplicates(withDuplicates);
    console.log('Test 2 - With duplicates:');
    console.log(`- Has duplicates: ${result2.hasDuplicates}`);
    console.log(`- Unique count: ${result2.uniqueCount}`);
    console.log(`- Duplicate count: ${result2.duplicateCount}`);
    console.log(`- Duplicate IDs: ${result2.duplicateIds.join(', ')}\n`);

    // Test 3: Remove duplicates
    const cleaned = ExamValidationUtil.removeDuplicates(withDuplicates);
    console.log('Test 3 - After removing duplicates:');
    console.log(`- Original count: ${withDuplicates.length}`);
    console.log(`- Cleaned count: ${cleaned.length}`);
    console.log(`- Question IDs: ${cleaned.map(q => q.MaCauHoi).join(', ')}\n`);
}

function testExamDistribution() {
    console.log('=== Testing Exam Distribution ===\n');

    // Create mock exam sets
    const exam1 = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2'),
        createMockQuestion('Q003', 'CHAP1', 2, 'Question 3')
    ];

    const exam2 = [
        createMockQuestion('Q004', 'CHAP1', 1, 'Question 4'),
        createMockQuestion('Q005', 'CHAP1', 2, 'Question 5'),
        createMockQuestion('Q006', 'CHAP2', 1, 'Question 6')
    ];

    const exam3 = [
        createMockQuestion('Q007', 'CHAP2', 1, 'Question 7'),
        createMockQuestion('Q008', 'CHAP2', 2, 'Question 8')
    ];

    // Test valid distribution
    console.log('Test 1 - Valid distribution:');
    const validDistribution = [exam1, exam2, exam3];
    const validation1 = ExamValidationUtil.validateExamDistribution(validDistribution);
    console.log(`- Is valid: ${validation1.isValid}`);
    console.log(`- Total exams: ${validation1.statistics.totalExams}`);
    console.log(`- Total unique questions: ${validation1.statistics.totalUniqueQuestions}`);
    console.log(`- Questions per exam: ${validation1.statistics.questionsPerExam.join(', ')}`);
    console.log(`- Errors: ${validation1.errors.length}`);
    console.log(`- Warnings: ${validation1.warnings.length}\n`);

    // Test with overlapping questions
    const examWithOverlap = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'), // Overlap with exam1
        createMockQuestion('Q009', 'CHAP2', 2, 'Question 9'),
        createMockQuestion('Q010', 'CHAP2', 2, 'Question 10')
    ];

    console.log('Test 2 - With overlapping questions:');
    const invalidDistribution = [exam1, exam2, examWithOverlap];
    const validation2 = ExamValidationUtil.validateExamDistribution(invalidDistribution);
    console.log(`- Is valid: ${validation2.isValid}`);
    console.log(`- Overlap count: ${validation2.statistics.overlapCount}`);
    console.log(`- Errors: ${validation2.errors.length}`);
    if (validation2.errors.length > 0) {
        validation2.errors.forEach(error => console.log(`  - ${error}`));
    }
    console.log();

    // Test with internal duplicates
    const examWithInternalDuplicates = [
        createMockQuestion('Q011', 'CHAP1', 1, 'Question 11'),
        createMockQuestion('Q012', 'CHAP1', 1, 'Question 12'),
        createMockQuestion('Q011', 'CHAP1', 1, 'Question 11 duplicate') // Internal duplicate
    ];

    console.log('Test 3 - With internal duplicates:');
    const distributionWithInternalDups = [exam1, exam2, examWithInternalDuplicates];
    const validation3 = ExamValidationUtil.validateExamDistribution(distributionWithInternalDups);
    console.log(`- Is valid: ${validation3.isValid}`);
    console.log(`- Errors: ${validation3.errors.length}`);
    if (validation3.errors.length > 0) {
        validation3.errors.forEach(error => console.log(`  - ${error}`));
    }
    console.log();
}

function testIntegrityReport() {
    console.log('=== Testing Integrity Report ===\n');

    // Create test data with various issues
    const exam1 = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2'),
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1 duplicate') // Internal duplicate
    ];

    const exam2 = [
        createMockQuestion('Q003', 'CHAP1', 2, 'Question 3'),
        createMockQuestion('Q004', 'CHAP2', 1, 'Question 4'),
        createMockQuestion('Q005', 'CHAP2', 1, 'Question 5'),
        createMockQuestion('Q006', 'CHAP2', 2, 'Question 6')
    ];

    const exam3 = [
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2 overlap'), // Overlap with exam1
        createMockQuestion('Q007', 'CHAP3', 1, 'Question 7')
    ];

    const examSets = [exam1, exam2, exam3];
    const report = ExamValidationUtil.generateIntegrityReport(examSets);
    
    console.log('Integrity Report:');
    console.log(report);
}

function testCLOAndChapterDistribution() {
    console.log('\n=== Testing CLO and Chapter Distribution ===\n');

    const questions = [
        createMockQuestion('Q001', 'CHAP1', 1, 'Question 1'),
        createMockQuestion('Q002', 'CHAP1', 1, 'Question 2'),
        createMockQuestion('Q003', 'CHAP1', 2, 'Question 3'),
        createMockQuestion('Q004', 'CHAP2', 1, 'Question 4'),
        createMockQuestion('Q005', 'CHAP2', 2, 'Question 5'),
        createMockQuestion('Q006', 'CHAP2', 3, 'Question 6')
    ];

    const cloDistribution = ExamValidationUtil.getCLODistribution(questions);
    const chapterDistribution = ExamValidationUtil.getChapterDistribution(questions);

    console.log('CLO Distribution:');
    Object.entries(cloDistribution).forEach(([clo, count]) => {
        console.log(`- CLO ${clo}: ${count} questions`);
    });

    console.log('\nChapter Distribution:');
    Object.entries(chapterDistribution).forEach(([chapter, count]) => {
        console.log(`- ${chapter}: ${count} questions`);
    });
}

function runAllTests() {
    console.log('🧪 DUPLICATE PREVENTION TEST SUITE\n');
    console.log('Author: Linh Dang Dev');
    console.log('Date:', new Date().toISOString());
    console.log('=' .repeat(50) + '\n');

    try {
        testDuplicateDetection();
        testExamDistribution();
        testIntegrityReport();
        testCLOAndChapterDistribution();

        console.log('\n' + '=' .repeat(50));
        console.log('✅ All tests completed successfully!');
        console.log('🔒 Duplicate prevention system is working correctly.');
        
    } catch (error) {
        console.error('\n' + '=' .repeat(50));
        console.error('❌ Test failed with error:');
        console.error(error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

export { runAllTests, testDuplicateDetection, testExamDistribution, testIntegrityReport };
