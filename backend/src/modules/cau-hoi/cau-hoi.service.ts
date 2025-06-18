import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { Cache } from 'cache-manager';
import { BaseService } from '../../common/base.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CreateCauHoiDto, UpdateCauHoiDto, CreateQuestionWithAnswersDto, UpdateQuestionWithAnswersDto } from '../../dto';
import { CreateCauTraLoiDto } from '../../dto/cau-tra-loi.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { randomUUID } from 'crypto';
import { CauTraLoiService } from '../cau-tra-loi/cau-tra-loi.service';

@Injectable()
export class CauHoiService extends BaseService<CauHoi> {
    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        private readonly dataSource: DataSource,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly cauTraLoiService: CauTraLoiService,
    ) {
        super(cauHoiRepository, 'MaCauHoi');
    }

    async findAll(
        paginationDto: PaginationDto,
        includeAnswers: boolean = false,
        answersPagination?: PaginationDto
    ): Promise<{ items: any[]; meta: any }> {
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;

        // Generate cache key
        const cacheKey = `questions:${page}:${limit}:${includeAnswers}:${answersPagination ? JSON.stringify(answersPagination) : 'all'}`;

        // Try to get from cache first
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as any;
        }

        // Get questions with pagination
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            },
            relations: ['CLO'] // Include CLO relation to get TenCLO
        });

        let items: any[] = questions;

        if (includeAnswers) {
            const questionIds = questions.map(q => q.MaCauHoi);
            const answersRepo = this.dataSource.getRepository(CauTraLoi);
            let answersMap: Record<string, any> = {};

            if (!answersPagination) {
                // Get all answers for these questions (no pagination)
                const answers = await answersRepo.find({
                    where: { MaCauHoi: In(questionIds) },
                    order: { ThuTu: 'ASC' },
                });
                answersMap = answers.reduce((map, answer) => {
                    if (!map[answer.MaCauHoi]) map[answer.MaCauHoi] = [];
                    map[answer.MaCauHoi].push(answer);
                    return map;
                }, {});
                items = questions.map(question => {
                    // Extract CLO information if available
                    const cloInfo = question.CLO ? {
                        MaCLO: question.CLO.MaCLO,
                        TenCLO: question.CLO.TenCLO
                    } : null;

                    // Return question with CLO info and answers
                    return {
                        ...question,
                        cloInfo, // Add CLO info
                        answers: answersMap[question.MaCauHoi] || []
                    };
                });
            } else {
                // Get paginated answers for each question
                const answersPromises = questionIds.map(async (questionId) => {
                    const { page: ansPage = 1, limit: ansLimit = 10 } = answersPagination;
                    const [answers, totalAnswers] = await answersRepo.findAndCount({
                        where: { MaCauHoi: questionId },
                        order: { ThuTu: 'ASC' },
                        skip: (ansPage - 1) * ansLimit,
                        take: ansLimit
                    });
                    return { questionId, answers, totalAnswers };
                });
                const answersResults = await Promise.all(answersPromises);
                answersMap = answersResults.reduce((map, result) => {
                    map[result.questionId] = {
                        items: result.answers,
                        meta: {
                            total: result.totalAnswers,
                            page: answersPagination?.page || 1,
                            limit: answersPagination?.limit || 10,
                            totalPages: Math.ceil(result.totalAnswers / (answersPagination?.limit || 10))
                        }
                    };
                    return map;
                }, {});
                items = questions.map(question => {
                    // Extract CLO information if available
                    const cloInfo = question.CLO ? {
                        MaCLO: question.CLO.MaCLO,
                        TenCLO: question.CLO.TenCLO
                    } : null;

                    // Return question with CLO info and answers
                    return {
                        ...question,
                        cloInfo, // Add CLO info
                        answers: answersMap[question.MaCauHoi] || { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
                    };
                });
            }
        }

        const result = {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };

        // Cache the result
        await this.cacheManager.set(cacheKey, result, 300); // Cache for 5 minutes

        return result;
    }

    // Add method to clear cache when data changes
    private async clearQuestionsCache() {
        // cache-manager does not support key pattern deletion by default, so you may need to use a custom store for production
        // For in-memory, you can use keys() if available
        if (typeof (this.cacheManager as any).store.keys === 'function') {
            const keys: string[] = await (this.cacheManager as any).store.keys();
            const questionKeys = keys.filter(key => key.startsWith('questions:'));
            await Promise.all(questionKeys.map(key => this.cacheManager.del(key)));
        }
    }

    async findOne(id: string): Promise<CauHoi> {
        const cauHoi = await this.cauHoiRepository.findOne({ where: { MaCauHoi: id } });
        if (!cauHoi) {
            throw new NotFoundException(`CauHoi with ID ${id} not found`);
        }
        return cauHoi;
    }

    async findOneWithAnswers(id: string): Promise<{ question: CauHoi, answers: CauTraLoi[] }> {
        const question = await this.findOne(id);

        const answers = await this.dataSource
            .getRepository(CauTraLoi)
            .find({
                where: { MaCauHoi: id },
                order: { ThuTu: 'ASC' },
            });

        return { question, answers };
    }

    async findByMaPhan(maPhan: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaPhan: maPhan },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByMaCLO(maCLO: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaCLO: maCLO },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByCauHoiCha(maCauHoiCha: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaCauHoiCha: maCauHoiCha },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async create(createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        const result = await super.create(createCauHoiDto);
        await this.clearQuestionsCache();
        return result;
    }

    async createQuestionWithAnswers(dto: CreateQuestionWithAnswersDto): Promise<{ question: CauHoi, answers: CauTraLoi[] }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            console.log('Creating question with answers. Payload:', JSON.stringify(dto, null, 2));

            // Create the question
            const questionData = {
                ...dto.question,
                MaCauHoi: randomUUID(), // Generate UUID explicitly instead of relying on DEFAULT
                NgayTao: new Date(),
            };

            // Validate required fields
            if (!questionData.MaPhan) {
                throw new Error('MaPhan is required');
            }

            if (!questionData.MaSoCauHoi) {
                // Generate a random question number if not provided
                questionData.MaSoCauHoi = Math.floor(Math.random() * 9000) + 1000;
            }

            // Set default values for optional fields if not provided
            if (questionData.XoaTamCauHoi === undefined) {
                questionData.XoaTamCauHoi = false;
            }

            if (questionData.SoLanDuocThi === undefined) {
                questionData.SoLanDuocThi = 0;
            }

            if (questionData.SoLanDung === undefined) {
                questionData.SoLanDung = 0;
            }

            console.log('Creating question with data:', JSON.stringify(questionData, null, 2));

            const question = queryRunner.manager.create(CauHoi, questionData);
            const savedQuestion = await queryRunner.manager.save(question);

            console.log('Question created successfully:', savedQuestion.MaCauHoi);

            // Create the answers
            const answers = dto.answers.map(answerDto => {
                return queryRunner.manager.create(CauTraLoi, {
                    ...answerDto,
                    MaCauTraLoi: randomUUID(), // Generate UUID explicitly for each answer
                    // Always use the newly created question's ID for the answers
                    MaCauHoi: savedQuestion.MaCauHoi,
                });
            });

            console.log('Creating answers:', JSON.stringify(answers, null, 2));

            const savedAnswers = await queryRunner.manager.save(answers);
            console.log('Answers created successfully:', savedAnswers.length);

            await queryRunner.commitTransaction();
            return { question: savedQuestion, answers: savedAnswers };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error creating question with answers:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to create question: ${error.message}`);
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: string, updateCauHoiDto: UpdateCauHoiDto): Promise<CauHoi> {
        await this.cauHoiRepository.update(id, updateCauHoiDto);
        const cauHoi = await this.cauHoiRepository.findOne({ where: { MaCauHoi: id } });
        if (!cauHoi) {
            throw new NotFoundException(`CauHoi with ID ${id} not found`);
        }
        return cauHoi;
    }

    async delete(id: string): Promise<void> {
        await super.delete(id);
        await this.clearQuestionsCache();
    }

    async softDeleteCauHoi(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        cauHoi.XoaTamCauHoi = true;
        await this.cauHoiRepository.save(cauHoi);
    }

    async restoreCauHoi(maCauHoi: string): Promise<void> {
        await this.cauHoiRepository.update(maCauHoi, {
            XoaTamCauHoi: false,
            NgaySua: new Date(),
        });
    }

    async updateQuestionWithAnswers(id: string, dto: UpdateQuestionWithAnswersDto): Promise<{ question: any, answers: CauTraLoi[] }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if question exists
            const existingQuestion = await this.findOne(id);

            // Update the question with only direct column properties
            const questionData = {
                ...dto.question,
                NgaySua: new Date(),
            };

            // Extract only the properties that are actual columns in the CauHoi entity
            // Explicitly pick only the properties we need, avoiding relationships
            const questionDataToUpdate = {
                MaSoCauHoi: questionData.MaSoCauHoi,
                NoiDung: questionData.NoiDung,
                MaPhan: questionData.MaPhan,
                MaCLO: questionData.MaCLO,
                CapDo: questionData.CapDo,
                HoanVi: questionData.HoanVi,
                SoCauHoiCon: questionData.SoCauHoiCon,
                DoPhanCachCauHoi: questionData.DoPhanCachCauHoi,
                MaCauHoiCha: questionData.MaCauHoiCha,
                XoaTamCauHoi: questionData.XoaTamCauHoi,
                SoLanDuocThi: questionData.SoLanDuocThi,
                SoLanDung: questionData.SoLanDung,
                NgaySua: questionData.NgaySua
            };

            await queryRunner.manager.update(CauHoi, id, questionDataToUpdate);

            // Fetch the updated question with all its relations
            const updatedQuestion = await queryRunner.manager.findOne(CauHoi, {
                where: { MaCauHoi: id },
                relations: ['Phan', 'Phan.MonHoc', 'Phan.MonHoc.Khoa', 'CLO']
            });

            if (!updatedQuestion) {
                throw new NotFoundException(`Question with ID ${id} not found after update`);
            }

            // Delete existing answers
            await queryRunner.manager.delete(CauTraLoi, { MaCauHoi: id });

            // Create new answers
            const answers = dto.answers.map(answerDto => {
                return queryRunner.manager.create(CauTraLoi, {
                    ...answerDto,
                    MaCauTraLoi: randomUUID(), // Generate UUID explicitly for each answer
                    MaCauHoi: id,
                });
            });

            const savedAnswers = await queryRunner.manager.save(answers);

            await queryRunner.commitTransaction();

            // Format the response to include khoa/monHoc/phan/clo information
            return {
                question: {
                    ...updatedQuestion,
                    khoa: updatedQuestion.Phan?.MonHoc?.Khoa,
                    monHoc: updatedQuestion.Phan?.MonHoc,
                    phan: updatedQuestion.Phan,
                    clo: updatedQuestion.CLO
                },
                answers: savedAnswers
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByMaPhanWithAnswers(maPhan: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;

        // Get questions for the section with CLO relation
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: { MaPhan: maPhan },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            },
            relations: ['CLO'] // Include CLO relation to get TenCLO
        });

        // Get all answers for these questions
        const questionIds = questions.map(q => q.MaCauHoi);
        const answers = await this.dataSource
            .getRepository(CauTraLoi)
            .find({
                where: { MaCauHoi: In(questionIds) },
                order: { ThuTu: 'ASC' },
            });

        // Group answers by question ID
        const answersMap = answers.reduce((map, answer) => {
            if (!map[answer.MaCauHoi]) {
                map[answer.MaCauHoi] = [];
            }
            map[answer.MaCauHoi].push(answer);
            return map;
        }, {});

        // Combine questions with their answers and add CLO info
        const items = questions.map(question => {
            // Extract CLO information if available
            const cloInfo = question.CLO ? {
                MaCLO: question.CLO.MaCLO,
                TenCLO: question.CLO.TenCLO
            } : null;

            return {
                question: {
                    ...question,
                    cloInfo // Add CLO info
                },
                answers: answersMap[question.MaCauHoi] || [],
            };
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOneWithFullDetails(id: string) {
        const cauHoi = await this.cauHoiRepository.findOne({
            where: { MaCauHoi: id },
            relations: ['Phan', 'Phan.MonHoc', 'Phan.MonHoc.Khoa', 'CLO']
        });

        if (!cauHoi) {
            throw new NotFoundException(`CauHoi with ID ${id} not found`);
        }

        // Lấy danh sách câu trả lời
        const answers = await this.dataSource
            .getRepository(CauTraLoi)
            .find({
                where: { MaCauHoi: id },
                order: { ThuTu: 'ASC' },
            });

        return {
            question: cauHoi,
            answers: answers,
            khoa: cauHoi.Phan?.MonHoc?.Khoa,
            monHoc: cauHoi.Phan?.MonHoc,
            phan: cauHoi.Phan,
            clo: cauHoi.CLO
        };
    }

    // Function to find group questions with their child questions and answers
    async findGroupQuestions(paginationDto: PaginationDto): Promise<{ items: any[]; meta: any }> {
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;

        // Query parent questions that have SoCauHoiCon > 0 (group questions)
        const [groupQuestions, total] = await this.cauHoiRepository.findAndCount({
            where: {
                MaCauHoiCha: IsNull(), // Use IsNull() instead of null
                // We'll filter for SoCauHoiCon > 0 after fetching
            },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            },
            relations: ['CLO'] // Include CLO relation
        });

        // Filter only questions with SoCauHoiCon > 0
        const actualGroupQuestions = groupQuestions.filter(q => q.SoCauHoiCon > 0);

        // Get parent question IDs
        const parentQuestionIds = actualGroupQuestions.map(q => q.MaCauHoi);

        // If no group questions found, return empty result
        if (parentQuestionIds.length === 0) {
            return {
                items: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0
                }
            };
        }

        // Find all child questions for these parent questions
        const childQuestions = await this.cauHoiRepository.find({
            where: {
                MaCauHoiCha: In(parentQuestionIds)
            },
            relations: ['CLO']
        });

        // Group child questions by parent question ID
        const childQuestionsMap = childQuestions.reduce<Record<string, any[]>>((map, question) => {
            if (!map[question.MaCauHoiCha]) {
                map[question.MaCauHoiCha] = [];
            }
            map[question.MaCauHoiCha].push(question);
            return map;
        }, {});

        // Get all question IDs (parent and child)
        const allQuestionIds = [
            ...parentQuestionIds,
            ...childQuestions.map(q => q.MaCauHoi)
        ];

        // Get all answers for all questions
        const answers = await this.dataSource
            .getRepository(CauTraLoi)
            .find({
                where: { MaCauHoi: In(allQuestionIds) },
                order: { ThuTu: 'ASC' },
            });

        // Group answers by question ID
        const answersMap = answers.reduce<Record<string, CauTraLoi[]>>((map, answer) => {
            if (!map[answer.MaCauHoi]) {
                map[answer.MaCauHoi] = [];
            }
            map[answer.MaCauHoi].push(answer);
            return map;
        }, {});

        // Format the result with the structure requested
        const items = actualGroupQuestions.map(question => {
            // Format parent question
            const formattedQuestion: Record<string, any> = {
                MaCauHoi: question.MaCauHoi,
                MaPhan: question.MaPhan,
                MaSoCauHoi: question.MaSoCauHoi,
                NoiDung: question.NoiDung,
                HoanVi: question.HoanVi,
                CapDo: question.CapDo,
                SoCauHoiCon: question.SoCauHoiCon,
                DoPhanCachCauHoi: question.DoPhanCachCauHoi,
                MaCauHoiCha: question.MaCauHoiCha,
                XoaTamCauHoi: question.XoaTamCauHoi,
                SoLanDuocThi: question.SoLanDuocThi || 0,
                SoLanDung: question.SoLanDung || 0,
                NgayTao: question.NgayTao,
                NgaySua: question.NgaySua,
                MaCLO: question.MaCLO,
                LaCauHoiNhom: question.SoCauHoiCon > 0,
                TenCLO: question.CLO?.TenCLO
            };

            // Add child questions if available
            if (childQuestionsMap[question.MaCauHoi]) {
                formattedQuestion['CauHoiCon'] = childQuestionsMap[question.MaCauHoi].map(childQ => {
                    return {
                        MaCauHoi: childQ.MaCauHoi,
                        MaSoCauHoi: childQ.MaSoCauHoi,
                        NoiDung: childQ.NoiDung,
                        CauTraLoi: answersMap[childQ.MaCauHoi] || []
                    };
                });
            }

            return formattedQuestion;
        });

        return {
            items,
            meta: {
                total: total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async createQuestion(createCauHoiDto: CreateCauHoiDto) {
        const cauHoi = this.cauHoiRepository.create(createCauHoiDto);
        return await this.cauHoiRepository.save(cauHoi);
    }

    // Add method to create question with answers that handles individual shuffle settings
    async createWithAnswers(data: { question: CreateCauHoiDto, answers: CreateCauTraLoiDto[] }) {
        const { question, answers } = data;

        // Create the question first
        const newQuestion = await this.createQuestion(question);

        // Then create answers with the question ID
        const answersWithQuestionId = answers.map(answer => ({
            ...answer,
            MaCauHoi: newQuestion.MaCauHoi
        }));

        // Save all answers
        const createdAnswers = await Promise.all(
            answersWithQuestionId.map(answer => this.cauTraLoiService.createCauTraLoi(answer))
        );

        return {
            question: newQuestion,
            answers: createdAnswers
        };
    }

    // Add method to update question with answers that handles individual shuffle settings
    async updateWithAnswers(id: string, data: { question: UpdateCauHoiDto, answers: any[] }) {
        const { question, answers } = data;

        // Update the question first
        await this.update(id, question);

        // Handle answers - update existing or create new ones
        for (const answer of answers) {
            if (answer.MaCauTraLoi) {
                // Update existing answer
                await this.cauTraLoiService.updateCauTraLoi(answer.MaCauTraLoi, {
                    NoiDung: answer.NoiDung,
                    ThuTu: answer.ThuTu,
                    LaDapAn: answer.LaDapAn,
                    HoanVi: answer.HoanVi
                });
            } else {
                // Create new answer
                await this.cauTraLoiService.createCauTraLoi({
                    MaCauHoi: id,
                    NoiDung: answer.NoiDung,
                    ThuTu: answer.ThuTu,
                    LaDapAn: answer.LaDapAn,
                    HoanVi: answer.HoanVi
                });
            }
        }

        // Get the updated question with its answers
        return this.findOne(id);
    }
}
