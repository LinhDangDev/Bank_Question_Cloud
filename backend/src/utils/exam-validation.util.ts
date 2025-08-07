/**
 * Exam Validation Utilities
 * Author: Linh Dang Dev
 * 
 * Utilities for validating exam integrity and preventing duplicates
 */

import { CauHoi } from '../entities/cau-hoi.entity';
import { Logger } from '@nestjs/common';

export class ExamValidationUtil {
    private static readonly logger = new Logger(ExamValidationUtil.name);

    /**
     * Check for duplicate questions in an array
     * @param questions Array of questions to check
     * @returns Object with duplicate info
     */
    static checkForDuplicates(questions: CauHoi[]): {
        hasDuplicates: boolean;
        duplicateIds: string[];
        duplicateCount: number;
        uniqueCount: number;
    } {
        const seenIds = new Set<string>();
        const duplicateIds: string[] = [];
        
        for (const question of questions) {
            if (question.MaCauHoi) {
                if (seenIds.has(question.MaCauHoi)) {
                    duplicateIds.push(question.MaCauHoi);
                } else {
                    seenIds.add(question.MaCauHoi);
                }
            }
        }

        return {
            hasDuplicates: duplicateIds.length > 0,
            duplicateIds,
            duplicateCount: duplicateIds.length,
            uniqueCount: seenIds.size
        };
    }

    /**
     * Remove duplicate questions from array
     * @param questions Array of questions
     * @returns Array with duplicates removed
     */
    static removeDuplicates(questions: CauHoi[]): CauHoi[] {
        const seenIds = new Set<string>();
        const uniqueQuestions: CauHoi[] = [];
        
        for (const question of questions) {
            if (question.MaCauHoi && !seenIds.has(question.MaCauHoi)) {
                seenIds.add(question.MaCauHoi);
                uniqueQuestions.push(question);
            }
        }
        
        const removedCount = questions.length - uniqueQuestions.length;
        if (removedCount > 0) {
            this.logger.warn(`Removed ${removedCount} duplicate questions`);
        }
        
        return uniqueQuestions;
    }

    /**
     * Validate exam question distribution
     * @param examQuestionSets Array of question sets for multiple exams
     * @returns Validation result
     */
    static validateExamDistribution(examQuestionSets: CauHoi[][]): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        statistics: {
            totalExams: number;
            questionsPerExam: number[];
            totalUniqueQuestions: number;
            overlapCount: number;
        };
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const allQuestionIds = new Set<string>();
        const questionsPerExam: number[] = [];
        let overlapCount = 0;

        // Check each exam for internal duplicates
        examQuestionSets.forEach((examQuestions, examIndex) => {
            const examCheck = this.checkForDuplicates(examQuestions);
            questionsPerExam.push(examCheck.uniqueCount);
            
            if (examCheck.hasDuplicates) {
                errors.push(`Exam ${examIndex + 1} has ${examCheck.duplicateCount} duplicate questions: ${examCheck.duplicateIds.join(', ')}`);
            }

            // Check for overlap with other exams
            examQuestions.forEach(question => {
                if (question.MaCauHoi) {
                    if (allQuestionIds.has(question.MaCauHoi)) {
                        overlapCount++;
                        errors.push(`Question ${question.MaCauHoi} appears in multiple exams`);
                    } else {
                        allQuestionIds.add(question.MaCauHoi);
                    }
                }
            });
        });

        // Check for empty exams
        examQuestionSets.forEach((examQuestions, examIndex) => {
            if (examQuestions.length === 0) {
                warnings.push(`Exam ${examIndex + 1} has no questions`);
            }
        });

        // Check for uneven distribution
        if (questionsPerExam.length > 1) {
            const minQuestions = Math.min(...questionsPerExam);
            const maxQuestions = Math.max(...questionsPerExam);
            const difference = maxQuestions - minQuestions;
            
            if (difference > 2) {
                warnings.push(`Uneven question distribution: ${minQuestions}-${maxQuestions} questions per exam`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            statistics: {
                totalExams: examQuestionSets.length,
                questionsPerExam,
                totalUniqueQuestions: allQuestionIds.size,
                overlapCount
            }
        };
    }

    /**
     * Generate exam integrity report
     * @param examQuestionSets Array of question sets for multiple exams
     * @returns Detailed report
     */
    static generateIntegrityReport(examQuestionSets: CauHoi[][]): string {
        const validation = this.validateExamDistribution(examQuestionSets);
        
        let report = '=== EXAM INTEGRITY REPORT ===\n\n';
        
        // Summary
        report += `📊 SUMMARY:\n`;
        report += `- Total Exams: ${validation.statistics.totalExams}\n`;
        report += `- Total Unique Questions: ${validation.statistics.totalUniqueQuestions}\n`;
        report += `- Questions per Exam: ${validation.statistics.questionsPerExam.join(', ')}\n`;
        report += `- Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;

        // Errors
        if (validation.errors.length > 0) {
            report += `🚨 ERRORS (${validation.errors.length}):\n`;
            validation.errors.forEach((error, index) => {
                report += `${index + 1}. ${error}\n`;
            });
            report += '\n';
        }

        // Warnings
        if (validation.warnings.length > 0) {
            report += `⚠️  WARNINGS (${validation.warnings.length}):\n`;
            validation.warnings.forEach((warning, index) => {
                report += `${index + 1}. ${warning}\n`;
            });
            report += '\n';
        }

        // Detailed breakdown
        report += `📋 DETAILED BREAKDOWN:\n`;
        examQuestionSets.forEach((examQuestions, examIndex) => {
            const examCheck = this.checkForDuplicates(examQuestions);
            report += `Exam ${examIndex + 1}: ${examCheck.uniqueCount} unique questions`;
            if (examCheck.hasDuplicates) {
                report += ` (${examCheck.duplicateCount} duplicates)`;
            }
            report += '\n';
        });

        if (validation.statistics.overlapCount > 0) {
            report += `\n🔄 OVERLAP: ${validation.statistics.overlapCount} questions appear in multiple exams\n`;
        }

        report += '\n=== END REPORT ===';
        
        return report;
    }

    /**
     * Quick validation for single exam
     * @param questions Array of questions for single exam
     * @returns True if valid (no duplicates)
     */
    static isValidExam(questions: CauHoi[]): boolean {
        const check = this.checkForDuplicates(questions);
        return !check.hasDuplicates;
    }

    /**
     * Get question distribution by CLO
     * @param questions Array of questions
     * @returns CLO distribution
     */
    static getCLODistribution(questions: CauHoi[]): Record<number, number> {
        const distribution: Record<number, number> = {};
        
        questions.forEach(question => {
            const clo = question.MaCLO || 0;
            distribution[clo] = (distribution[clo] || 0) + 1;
        });
        
        return distribution;
    }

    /**
     * Get question distribution by chapter
     * @param questions Array of questions
     * @returns Chapter distribution
     */
    static getChapterDistribution(questions: CauHoi[]): Record<string, number> {
        const distribution: Record<string, number> = {};
        
        questions.forEach(question => {
            const chapter = question.MaPhan || 'Unknown';
            distribution[chapter] = (distribution[chapter] || 0) + 1;
        });
        
        return distribution;
    }
}
