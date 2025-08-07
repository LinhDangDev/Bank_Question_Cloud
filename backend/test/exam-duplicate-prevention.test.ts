import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from '../src/services/exam.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeThi } from '../src/entities/de-thi.entity';
import { CauHoi } from '../src/entities/cau-hoi.entity';
import { CauTraLoi } from '../src/entities/cau-tra-loi.entity';
import { ChiTietDeThi } from '../src/entities/chi-tiet-de-thi.entity';

// Manual declarations for Jest globals since @jest/globals may not be available
declare const describe: (name: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: any;
declare const jest: any;

// Create interfaces for the test if they don't exist in source
interface ExamRequest {
    tenDeThi: string;
    maMonHoc: string;
    nguoiTao: string;
    soLuongDe: number;
    hoanViDapAn: boolean; // Added required property
    matrix: ExamMatrixItem[];
}

interface ExamMatrixItem {
    maPhan: string;
    clo1: number;
    clo2: number;
    clo3: number;
    clo4: number;
    clo5: number;
}

// Mock entity type with only necessary properties for the test
type CauHoiTest = Partial<CauHoi>;

describe('ExamService - Duplicate Prevention', () => {
    let service: ExamService;
    let deThiRepository: Repository<DeThi>;
    let cauHoiRepository: Repository<CauHoi>;
    let cauTraLoiRepository: Repository<CauTraLoi>;
    let deThiCauHoiRepository: Repository<ChiTietDeThi>;

    // Mock data - define with Partial<CauHoi> to avoid type errors
    const mockQuestions: CauHoiTest[] = [
        {
            MaCauHoi: 'Q001',
            NoiDung: 'Question 1 content',
            MaPhan: 'CHAP1',
            MaCLO: '1',
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
            NguoiCapNhat: 'admin',
            CLO: { ThuTu: 1 }
        } as unknown as CauHoi,
        {
            MaCauHoi: 'Q002',
            NoiDung: 'Question 2 content',
            MaPhan: 'CHAP1',
            MaCLO: '1',
            SoLanDuocThi: 0,
            SoLanDung: 0,
            DoKhoThucTe: 0.6,
            DoPhanCachCauHoi: 1.0,
            HoanVi: 1,
            SoCauHoiCon: 0,
            MaCauHoiCha: null,
            NgayTao: new Date(),
            NgayCapNhat: new Date(),
            DaDuyet: true,
            NguoiTao: 'admin',
            NguoiCapNhat: 'admin',
            CLO: { ThuTu: 1 }
        } as unknown as CauHoi,
        {
            MaCauHoi: 'Q003',
            NoiDung: 'Question 3 content',
            MaPhan: 'CHAP1',
            MaCLO: '2',
            SoLanDuocThi: 0,
            SoLanDung: 0,
            DoKhoThucTe: 0.4,
            DoPhanCachCauHoi: 1.0,
            HoanVi: 1,
            SoCauHoiCon: 0,
            MaCauHoiCha: null,
            NgayTao: new Date(),
            NgayCapNhat: new Date(),
            DaDuyet: true,
            NguoiTao: 'admin',
            NguoiCapNhat: 'admin',
            CLO: { ThuTu: 2 }
        } as unknown as CauHoi
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExamService,
                {
                    provide: getRepositoryToken(DeThi),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(CauHoi),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(CauTraLoi),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(ChiTietDeThi),
                    useClass: Repository,
                },
            ],
        }).compile();

        service = module.get<ExamService>(ExamService);
        deThiRepository = module.get<Repository<DeThi>>(getRepositoryToken(DeThi));
        cauHoiRepository = module.get<Repository<CauHoi>>(getRepositoryToken(CauHoi));
        cauTraLoiRepository = module.get<Repository<CauTraLoi>>(getRepositoryToken(CauTraLoi));
        deThiCauHoiRepository = module.get<Repository<ChiTietDeThi>>(getRepositoryToken(ChiTietDeThi));
    });

    describe('validateAndRemoveDuplicates', () => {
        it('should remove duplicate questions', () => {
            // Create array with duplicates
            const questionsWithDuplicates = [
                mockQuestions[0],
                mockQuestions[1],
                mockQuestions[0], // Duplicate
                mockQuestions[2],
                mockQuestions[1], // Duplicate
            ];

            // Access private method using bracket notation
            const result = (service as any).validateAndRemoveDuplicates(questionsWithDuplicates);

            expect(result).toHaveLength(3);
            expect(result.map(q => q.MaCauHoi)).toEqual(['Q001', 'Q002', 'Q003']);
        });

        it('should return same array if no duplicates', () => {
            const result = (service as any).validateAndRemoveDuplicates(mockQuestions);

            expect(result).toHaveLength(3);
            expect(result).toEqual(mockQuestions);
        });

        it('should handle empty array', () => {
            const result = (service as any).validateAndRemoveDuplicates([]);

            expect(result).toHaveLength(0);
        });
    });

    describe('distributeQuestionsAcrossExams', () => {
        it('should not create duplicate questions across exams', () => {
            const matrix: ExamMatrixItem[] = [
                {
                    maPhan: 'CHAP1',
                    clo1: 2,
                    clo2: 1,
                    clo3: 0,
                    clo4: 0,
                    clo5: 0
                }
            ];

            // Mock enough questions for multiple exams
            const manyQuestions: CauHoiTest[] = [];
            for (let i = 1; i <= 10; i++) {
                manyQuestions.push({
                    ...mockQuestions[0],
                    MaCauHoi: `Q${i.toString().padStart(3, '0')}`,
                    NoiDung: `Question ${i} content`,
                    MaCLO: i <= 6 ? '1' : '2',
                    CLO: { ThuTu: i <= 6 ? 1 : 2 }
                } as unknown as CauHoi);
            }

            const result = (service as any).distributeQuestionsAcrossExams(manyQuestions, matrix, 3);

            expect(result).toHaveLength(3); // 3 exams

            // Check no duplicates across exams
            const allUsedQuestions = new Set<string>();
            for (const examQuestions of result) {
                for (const question of examQuestions) {
                    expect(allUsedQuestions.has(question.MaCauHoi)).toBe(false);
                    allUsedQuestions.add(question.MaCauHoi);
                }
            }
        });

        it('should handle insufficient questions gracefully', () => {
            const matrix: ExamMatrixItem[] = [
                {
                    maPhan: 'CHAP1',
                    clo1: 5, // More than available
                    clo2: 0,
                    clo3: 0,
                    clo4: 0,
                    clo5: 0
                }
            ];

            const result = (service as any).distributeQuestionsAcrossExams(mockQuestions, matrix, 2);

            expect(result).toHaveLength(2);

            // Should not have duplicates even with insufficient questions
            const allUsedQuestions = new Set<string>();
            for (const examQuestions of result) {
                for (const question of examQuestions) {
                    expect(allUsedQuestions.has(question.MaCauHoi)).toBe(false);
                    allUsedQuestions.add(question.MaCauHoi);
                }
            }
        });
    });

    describe('Integration Test - Full Exam Generation', () => {
        it('should generate multiple exams without duplicates', async () => {
            // Mock repository methods
            jest.spyOn(cauHoiRepository, 'find').mockResolvedValue(mockQuestions as CauHoi[]);
            jest.spyOn(deThiRepository, 'create').mockImplementation((data) => data as DeThi);
            jest.spyOn(deThiRepository, 'save').mockImplementation(async (data) => data as DeThi);
            jest.spyOn(deThiCauHoiRepository, 'save').mockImplementation(async (data) => data as any);

            const examRequest: ExamRequest = {
                tenDeThi: 'Test Exam',
                maMonHoc: 'SUBJ001',
                nguoiTao: 'admin',
                soLuongDe: 2,
                hoanViDapAn: true, // Added required property
                matrix: [
                    {
                        maPhan: 'CHAP1',
                        clo1: 2,
                        clo2: 1,
                        clo3: 0,
                        clo4: 0,
                        clo5: 0
                    }
                ]
            };

            const result = await service.generateExam(examRequest);

            expect(result.deThiIds).toHaveLength(2);

            // Verify no duplicates by checking the saved exam questions
            const saveCallsArgs = (deThiCauHoiRepository.save as jest.Mock).mock.calls;
            const allQuestionIds = new Set<string>();

            for (const callArgs of saveCallsArgs) {
                const examQuestions = callArgs[0];
                if (Array.isArray(examQuestions)) {
                    for (const eq of examQuestions) {
                        expect(allQuestionIds.has(eq.MaCauHoi)).toBe(false);
                        allQuestionIds.add(eq.MaCauHoi);
                    }
                }
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle questions with same content but different IDs', () => {
            const questionsWithSameContent = [
                { ...mockQuestions[0], MaCauHoi: 'Q001' },
                { ...mockQuestions[0], MaCauHoi: 'Q004', NoiDung: mockQuestions[0].NoiDung }
            ];

            const result = (service as any).validateAndRemoveDuplicates(questionsWithSameContent);

            // Should keep both since they have different IDs
            expect(result).toHaveLength(2);
        });

        it('should handle null or undefined question IDs', () => {
            const questionsWithNullIds = [
                { ...mockQuestions[0], MaCauHoi: null },
                { ...mockQuestions[1], MaCauHoi: undefined },
                mockQuestions[2]
            ];

            const result = (service as any).validateAndRemoveDuplicates(questionsWithNullIds);

            // Should handle gracefully
            expect(result.length).toBeGreaterThan(0);
        });
    });
});
