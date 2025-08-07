import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull, Like, MoreThan } from 'typeorm';
import { Cache } from 'cache-manager';
import { BaseService } from '../../common/base.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CreateCauHoiDto, UpdateCauHoiDto, CreateQuestionWithAnswersDto, UpdateQuestionWithAnswersDto, CreateGroupQuestionDto } from '../../dto';
import { CreateCauTraLoiDto } from '../../dto/cau-tra-loi.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { Files } from '../../entities/files.entity';
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
        const {
            page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
            limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
            search = '',
            isDeleted = 'false',
            maCLO = '',
            capDo = '',
            startDate = '',
            endDate = '',
            questionType = ''
        } = paginationDto as any;

        // Generate cache key
        const cacheKey = `questions:${page}:${limit}:${includeAnswers}:${search}:${isDeleted}:${maCLO}:${capDo}:${startDate}:${endDate}:${questionType}:${answersPagination ? JSON.stringify(answersPagination) : 'all'}`;

        // Try to get from cache first
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as any;
        }

        // Build where conditions
        const whereConditions: any = {
            MaCauHoiCha: IsNull() // Only return parent questions
        };

        // Handle search
        if (search && search.trim() !== '') {
            whereConditions.NoiDung = Like(`%${search.trim()}%`);
        }

        // Handle isDeleted filter
        if (isDeleted === 'true') {
            whereConditions.XoaTamCauHoi = true;
        } else if (isDeleted === 'false') {
            whereConditions.XoaTamCauHoi = false;
        }

        // Handle CLO filter
        if (maCLO && maCLO !== '') {
            whereConditions.MaCLO = maCLO;
        }

        // Handle difficulty filter
        if (capDo && capDo !== '') {
            whereConditions.CapDo = parseInt(capDo);
        }

        // Handle question type filter
        if (questionType && questionType !== '') {
            if (questionType === 'single') {
                // For single questions: SoCauHoiCon = 0 (no child questions)
                whereConditions.SoCauHoiCon = 0;
            } else if (questionType === 'group') {
                // For group questions: SoCauHoiCon > 0 (has child questions)
                whereConditions.SoCauHoiCon = MoreThan(0);
            }
        }

        // Get questions with pagination - only include questions that are NOT child questions (MaCauHoiCha IS NULL)
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: whereConditions,
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

    async findByCreator(
        creatorId: string,
        paginationDto: PaginationDto,
        includeAnswers: boolean = false,
        answersPagination?: PaginationDto
    ): Promise<{ items: any[]; meta: any }> {
        const {
            page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
            limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
            search = '',
            isDeleted = 'false',
            maCLO = '',
            capDo = '',
            startDate = '',
            endDate = '',
            questionType = ''
        } = paginationDto as any;

        // Generate cache key
        const cacheKey = `questions:creator:${creatorId}:${page}:${limit}:${includeAnswers}:${search}:${isDeleted}:${maCLO}:${capDo}:${startDate}:${endDate}:${questionType}:${answersPagination ? JSON.stringify(answersPagination) : 'all'}`;

        // Try to get from cache first
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData as any;
        }

        // Build where conditions
        const whereConditions: any = {
            MaCauHoiCha: IsNull(), // Only return parent questions
            NguoiTao: creatorId // Filter by creator
        };

        // Handle search
        if (search && search.trim() !== '') {
            whereConditions.NoiDung = Like(`%${search.trim()}%`);
        }

        // Handle isDeleted filter
        if (isDeleted === 'true') {
            whereConditions.XoaTamCauHoi = true;
        } else if (isDeleted === 'false') {
            whereConditions.XoaTamCauHoi = false;
        }

        // Handle CLO filter
        if (maCLO && maCLO !== '') {
            whereConditions.MaCLO = maCLO;
        }

        // Handle difficulty filter
        if (capDo && capDo !== '') {
            whereConditions.CapDo = parseInt(capDo);
        }

        // Handle question type filter
        if (questionType && questionType !== '') {
            if (questionType === 'single') {
                // For single questions: SoCauHoiCon = 0 (no child questions)
                whereConditions.SoCauHoiCon = 0;
            } else if (questionType === 'group') {
                // For group questions: SoCauHoiCon > 0 (has child questions)
                whereConditions.SoCauHoiCon = MoreThan(0);
            }
        }

        // Get questions by creator with pagination - only include questions that are NOT child questions
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: whereConditions,
            relations: ['CLO'], // Include CLO relationship
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        const questionIds = questions.map(q => q.MaCauHoi);
        let items: any[] = [];
        let answersMap: any = {};

        if (includeAnswers && questionIds.length > 0) {
            const answersRepo = this.dataSource.getRepository(CauTraLoi);

            if (!answersPagination) {
                // Get all answers for each question
                const answers = await answersRepo.find({
                    where: { MaCauHoi: In(questionIds) },
                    order: { ThuTu: 'ASC' }
                });

                // Group answers by question ID
                answersMap = answers.reduce((map, answer) => {
                    if (!map[answer.MaCauHoi]) {
                        map[answer.MaCauHoi] = [];
                    }
                    map[answer.MaCauHoi].push(answer);
                    return map;
                }, {});

                items = questions.map(question => {
                    const cloInfo = question.CLO ? {
                        MaCLO: question.CLO.MaCLO,
                        TenCLO: question.CLO.TenCLO
                    } : null;

                    return {
                        ...question,
                        cloInfo,
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
                    const cloInfo = question.CLO ? {
                        MaCLO: question.CLO.MaCLO,
                        TenCLO: question.CLO.TenCLO
                    } : null;

                    return {
                        ...question,
                        cloInfo,
                        answers: answersMap[question.MaCauHoi]
                    };
                });
            }
        } else {
            items = questions.map(question => {
                const cloInfo = question.CLO ? {
                    MaCLO: question.CLO.MaCLO,
                    TenCLO: question.CLO.TenCLO
                } : null;

                return {
                    ...question,
                    cloInfo
                };
            });
        }

        const result = {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

        // Cache the result
        await this.cacheManager.set(cacheKey, result, 300); // Cache for 5 minutes

        return result;
    }

    // Add method to clear cache when data changes
    private async clearQuestionsCache() {
        try {
            // cache-manager does not support key pattern deletion by default, so you may need to use a custom store for production
            // For in-memory, you can use keys() if available
            if (this.cacheManager && (this.cacheManager as any).store && typeof (this.cacheManager as any).store.keys === 'function') {
                const keys: string[] = await (this.cacheManager as any).store.keys();
                const questionKeys = keys.filter(key => key.startsWith('questions:'));
                await Promise.all(questionKeys.map(key => this.cacheManager.del(key)));
            }
        } catch (error) {
            console.warn('Error clearing questions cache:', error);
            // Fail silently - cache clearing should not block the main operation
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
            where: {
                MaPhan: maPhan,
                MaCauHoiCha: IsNull() // Only return parent questions
            },
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
            where: {
                MaCLO: maCLO,
                MaCauHoiCha: IsNull() // Only return parent questions
            },
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
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: { MaCauHoiCha: maCauHoiCha },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                MaSoCauHoi: 'ASC' // Order by question number for proper sequence
            },
            relations: ['CLO'] // Include CLO relation
        });

        // Get all answers for these child questions
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

        // Combine questions with their answers and CLO info
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

    async create(createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        // Đảm bảo UUID được tạo cho MaCauHoi
        const data = {
            ...createCauHoiDto,
            MaCauHoi: randomUUID()
        };
        // Gọi phương thức create của repository thay vì super.create để tránh sử dụng DEFAULT
        const cauHoi = this.cauHoiRepository.create(data);
        const result = await this.cauHoiRepository.save(cauHoi);
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
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if question exists
            const existingQuestion = await this.findOne(id);
            if (!existingQuestion) {
                throw new NotFoundException(`Question with ID ${id} not found`);
            }

            // Delete related Files first
            await queryRunner.manager.delete(Files, { MaCauHoi: id });

            // Delete related CauTraLoi (answers)
            await queryRunner.manager.delete(CauTraLoi, { MaCauHoi: id });

            // Delete related ChiTietDeThi (exam details)
            await queryRunner.manager.delete(ChiTietDeThi, { MaCauHoi: id });

            // If this is a parent question, delete child questions
            if (existingQuestion.SoCauHoiCon > 0) {
                const childQuestions = await queryRunner.manager.find(CauHoi, {
                    where: { MaCauHoiCha: id }
                });

                for (const childQuestion of childQuestions) {
                    // Delete child question's related data
                    await queryRunner.manager.delete(Files, { MaCauHoi: childQuestion.MaCauHoi });
                    await queryRunner.manager.delete(CauTraLoi, { MaCauHoi: childQuestion.MaCauHoi });
                    await queryRunner.manager.delete(ChiTietDeThi, { MaCauHoi: childQuestion.MaCauHoi });

                    // Delete child question
                    await queryRunner.manager.delete(CauHoi, { MaCauHoi: childQuestion.MaCauHoi });
                }
            }

            // Finally delete the main question
            await queryRunner.manager.delete(CauHoi, { MaCauHoi: id });

            await queryRunner.commitTransaction();
            await this.clearQuestionsCache();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async softDeleteCauHoi(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        cauHoi.XoaTamCauHoi = true;
        cauHoi.NgaySua = new Date();
        await this.cauHoiRepository.save(cauHoi);

        // Clear cached question lists so pagination counts are accurate
        await this.clearQuestionsCache();
    }

    async restoreCauHoi(maCauHoi: string): Promise<void> {
        await this.cauHoiRepository.update(maCauHoi, {
            XoaTamCauHoi: false,
            NgaySua: new Date(),
        });

        // Clear cache after restore to avoid stale pagination data
        await this.clearQuestionsCache();
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
            where: {
                MaPhan: maPhan,
                MaCauHoiCha: IsNull() // Only return parent questions
            },
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
        const {
            page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
            limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
            search = '',
            isDeleted = 'false',
            maCLO = '',
            capDo = '',
            startDate = '',
            endDate = ''
        } = paginationDto as any;

        // Build where conditions
        const whereConditions: any = {
            MaCauHoiCha: IsNull(), // Only return parent questions
            SoCauHoiCon: In([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), // Only group questions (with child questions)
        };

        // Handle search
        if (search && search.trim() !== '') {
            whereConditions.NoiDung = Like(`%${search.trim()}%`);
        }

        // Handle isDeleted filter
        if (isDeleted === 'true') {
            whereConditions.XoaTamCauHoi = true;
        } else if (isDeleted === 'false') {
            whereConditions.XoaTamCauHoi = false;
        }

        // Handle CLO filter
        if (maCLO && maCLO !== '') {
            whereConditions.MaCLO = maCLO;
        }

        // Handle difficulty filter
        if (capDo && capDo !== '') {
            whereConditions.CapDo = parseInt(capDo);
        }

        // Query parent questions that have SoCauHoiCon > 0 (group questions)
        const [groupQuestions, total] = await this.cauHoiRepository.findAndCount({
            where: whereConditions,
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            },
            relations: ['CLO'] // Include CLO relation
        });

        // Get parent question IDs
        const parentQuestionIds = groupQuestions.map(q => q.MaCauHoi);

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
        const items = groupQuestions.map(question => {
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
                LaCauHoiNhom: true,  // Always true for group questions
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
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async createQuestion(createCauHoiDto: CreateCauHoiDto) {
        // Thêm UUID vào MaCauHoi khi tạo câu hỏi mới
        const cauHoi = this.cauHoiRepository.create({
            ...createCauHoiDto,
            MaCauHoi: randomUUID() // Đảm bảo UUID được tạo cho mỗi câu hỏi mới
        });
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

    async createGroupQuestion(dto: CreateGroupQuestionDto): Promise<any> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Tạo ID cho câu hỏi cha
            const parentId = randomUUID();
            console.log('Tạo ID câu hỏi cha:', parentId);

            // 2. Tạo câu hỏi cha với đầy đủ các trường bắt buộc và không thiết lập MaCauHoiCha cho câu hỏi cha
            const parentQuestion = {
                ...dto.parentQuestion,
                MaCauHoi: parentId,
                SoCauHoiCon: dto.childQuestions.length,
                NgayTao: new Date(),
                MaSoCauHoi: dto.parentQuestion.MaSoCauHoi || Math.floor(Math.random() * 9000) + 1000,
                NoiDung: dto.parentQuestion.NoiDung || 'Câu hỏi nhóm',
                HoanVi: dto.parentQuestion.HoanVi !== undefined ? dto.parentQuestion.HoanVi : true,
                CapDo: dto.parentQuestion.CapDo || 1,
                XoaTamCauHoi: dto.parentQuestion.XoaTamCauHoi !== undefined ? dto.parentQuestion.XoaTamCauHoi : false,
                SoLanDuocThi: dto.parentQuestion.SoLanDuocThi !== undefined ? dto.parentQuestion.SoLanDuocThi : 0,
                SoLanDung: dto.parentQuestion.SoLanDung !== undefined ? dto.parentQuestion.SoLanDung : 0,
                NguoiTao: dto.parentQuestion.NguoiTao // Đảm bảo NguoiTao được thiết lập đúng
                // Omit MaCauHoiCha completely for parent question - it will be undefined
            };

            // In ra toàn bộ dữ liệu trước khi insert
            console.log('Dữ liệu câu hỏi cha trước khi insert:', JSON.stringify(parentQuestion, null, 2));

            // Lưu câu hỏi cha
            await queryRunner.manager.save(CauHoi, parentQuestion);
            console.log('Lưu câu hỏi cha thành công với ID:', parentId);

            // 3. Tạo các câu hỏi con với MaCauHoiCha là ID của câu hỏi cha
            let childCount = 0;
            for (const childDto of dto.childQuestions) {
                childCount++;
                const childId = randomUUID();

                // Xử lý trường hợp childDto.question không có giá trị
                const childQuestionData = childDto.question || {};

                // Tạo câu hỏi con với MaCauHoiCha rõ ràng và đầy đủ các trường bắt buộc
                const childQuestion = {
                    ...childQuestionData,
                    MaCauHoi: childId,
                    MaCauHoiCha: parentId, // QUAN TRỌNG: Chỉ định rõ ID câu hỏi cha
                    MaPhan: childQuestionData.MaPhan || parentQuestion.MaPhan,
                    MaSoCauHoi: childQuestionData.MaSoCauHoi || (parentQuestion.MaSoCauHoi * 10 + childCount),
                    NoiDung: childQuestionData.NoiDung || `Câu hỏi con ${childCount}`,
                    HoanVi: childQuestionData.HoanVi !== undefined ? childQuestionData.HoanVi : true,
                    CapDo: childQuestionData.CapDo || parentQuestion.CapDo,
                    SoCauHoiCon: 0, // Câu hỏi con không có con
                    XoaTamCauHoi: childQuestionData.XoaTamCauHoi !== undefined ? childQuestionData.XoaTamCauHoi : false,
                    SoLanDuocThi: childQuestionData.SoLanDuocThi !== undefined ? childQuestionData.SoLanDuocThi : 0,
                    SoLanDung: childQuestionData.SoLanDung !== undefined ? childQuestionData.SoLanDung : 0,
                    NgayTao: new Date(),
                    NguoiTao: parentQuestion.NguoiTao // Sử dụng NguoiTao từ câu hỏi cha
                };

                console.log(`Dữ liệu câu hỏi con ${childCount} trước khi insert:`, JSON.stringify(childQuestion, null, 2));

                // Lưu câu hỏi con sử dụng save thay vì createQueryBuilder để đảm bảo tất cả validation
                await queryRunner.manager.save(CauHoi, childQuestion);
                console.log(`Lưu câu hỏi con ${childCount} thành công với ID:`, childId);

                // Kiểm tra và tạo câu trả lời cho câu hỏi con
                if (Array.isArray(childDto.answers) && childDto.answers.length > 0) {
                    // Tạo các câu trả lời cho câu hỏi con
                    const answers = childDto.answers.map((answer, idx) => ({
                        MaCauTraLoi: randomUUID(),
                        MaCauHoi: childId, // Liên kết với câu hỏi con
                        NoiDung: answer.NoiDung || `Đáp án ${idx + 1}`,
                        ThuTu: answer.ThuTu || idx + 1,
                        LaDapAn: answer.LaDapAn !== undefined ? answer.LaDapAn : idx === 0,
                        HoanVi: answer.HoanVi !== undefined ? answer.HoanVi : true
                    }));

                    console.log(`Dữ liệu ${answers.length} câu trả lời cho câu hỏi con ${childCount}:`,
                        JSON.stringify(answers, null, 2));

                    // Lưu các câu trả lời sử dụng save thay vì createQueryBuilder
                    for (const answer of answers) {
                        await queryRunner.manager.save(CauTraLoi, answer);
                    }
                    console.log(`Lưu ${answers.length} câu trả lời cho câu hỏi con ${childCount} thành công`);
                } else {
                    console.warn(`Câu hỏi con ${childCount} không có câu trả lời`);
                }
            }

            // Commit transaction khi tất cả đều thành công
            await queryRunner.commitTransaction();
            console.log('Transaction đã được commit thành công');

            // Kiểm tra xem câu hỏi đã được tạo thành công chưa
            const parentCheck = await this.cauHoiRepository.findOne({ where: { MaCauHoi: parentId } });
            console.log('Kiểm tra câu hỏi cha sau khi commit:', parentCheck ? 'Tồn tại' : 'Không tồn tại');

            const childCheck = await this.cauHoiRepository.find({ where: { MaCauHoiCha: parentId } });
            console.log('Số câu hỏi con tìm thấy sau khi commit:', childCheck.length);

            return {
                success: true,
                parentId: parentId,
                childCount: childCheck.length
            };
        } catch (error) {
            // Rollback nếu có lỗi
            await queryRunner.rollbackTransaction();
            console.error('Lỗi khi tạo câu hỏi nhóm:', error);
            throw new Error(`Không thể tạo câu hỏi nhóm: ${error.message}`);
        } finally {
            // Giải phóng queryRunner
            await queryRunner.release();
        }
    }

    // Get group questions created by a specific teacher
    async findGroupQuestionsByCreator(creatorId: string, paginationDto: PaginationDto): Promise<{ items: any[]; meta: any }> {
        const {
            page = PAGINATION_CONSTANTS.DEFAULT_PAGE,
            limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
            isDeleted = 'false',
            search = '',
        } = paginationDto as any;

        // Build where conditions
        const whereConditions: any = {
            SoCauHoiCon: In([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), // Questions with child questions
            NguoiTao: creatorId, // Filter by creator
            MaCauHoiCha: IsNull() // Only parent questions
        };

        // Handle isDeleted filter
        if (isDeleted === 'true') {
            whereConditions.XoaTamCauHoi = true;
        } else if (isDeleted === 'false') {
            whereConditions.XoaTamCauHoi = false;
        }

        // Handle search
        if (search && search.trim() !== '') {
            whereConditions.NoiDung = Like(`%${search.trim()}%`);
        }

        // Find all group questions by the creator
        const [groupQuestions, total] = await this.cauHoiRepository.findAndCount({
            where: whereConditions,
            skip: (page - 1) * limit,
            take: limit,
            order: { NgayTao: 'DESC' },
            relations: ['CLO'] // Include CLO relation
        });

        // If there are no group questions, return empty result
        if (groupQuestions.length === 0) {
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

        // Get child questions for each group question
        const groupQuestionIds = groupQuestions.map(q => q.MaCauHoi);

        // Find all child questions for these group questions
        const childQuestions = await this.cauHoiRepository.find({
            where: { MaCauHoiCha: In(groupQuestionIds) },
            order: { NgayTao: 'ASC' }
        });

        // Group child questions by parent ID
        const childrenByParent = childQuestions.reduce((acc, child) => {
            if (!acc[child.MaCauHoiCha]) {
                acc[child.MaCauHoiCha] = [];
            }
            acc[child.MaCauHoiCha].push(child);
            return acc;
        }, {});

        // Get answers for all questions (group and child)
        const allQuestionIds = [...groupQuestionIds, ...childQuestions.map(q => q.MaCauHoi)];
        const answers = await this.dataSource.getRepository(CauTraLoi).find({
            where: { MaCauHoi: In(allQuestionIds) },
            order: { ThuTu: 'ASC' }
        });

        // Group answers by question ID
        const answersByQuestion = answers.reduce((acc, answer) => {
            if (!acc[answer.MaCauHoi]) {
                acc[answer.MaCauHoi] = [];
            }
            acc[answer.MaCauHoi].push(answer);
            return acc;
        }, {});

        // Combine data into final result
        const items = groupQuestions.map(group => {
            // Format parent question
            const formattedQuestion: Record<string, any> = {
                ...group,
                LaCauHoiNhom: true,  // Always true for group questions
                TenCLO: group.CLO?.TenCLO,
                CauHoiCon: (childrenByParent[group.MaCauHoi] || []).map(child => ({
                    MaCauHoi: child.MaCauHoi,
                    MaSoCauHoi: child.MaSoCauHoi,
                    NoiDung: child.NoiDung,
                    CauTraLoi: answersByQuestion[child.MaCauHoi] || []
                }))
            };

            return formattedQuestion;
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

    // Find questions by section ID and creator
    async findByMaPhanAndCreator(maPhan: string, creatorId: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: {
                MaPhan: maPhan,
                MaCauHoiCha: IsNull(), // Only return parent questions
                NguoiTao: creatorId // Only return questions created by this user
            },
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

    // Find questions with answers by section ID and creator
    async findByMaPhanWithAnswersAndCreator(maPhan: string, creatorId: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;

        // Find questions by section and creator
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: {
                MaPhan: maPhan,
                MaCauHoiCha: IsNull(), // Only return parent questions
                NguoiTao: creatorId // Only return questions created by this user
            },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        if (questions.length === 0) {
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

        // Get all question IDs
        const questionIds = questions.map(q => q.MaCauHoi);

        // Find all answers for these questions
        const answers = await this.dataSource.getRepository(CauTraLoi).find({
            where: { MaCauHoi: In(questionIds) },
            order: { ThuTu: 'ASC' }
        });

        // Group answers by question ID
        const answersMap = answers.reduce((map, answer) => {
            if (!map[answer.MaCauHoi]) {
                map[answer.MaCauHoi] = [];
            }
            map[answer.MaCauHoi].push(answer);
            return map;
        }, {});

        // Combine questions with their answers
        const items = questions.map(question => ({
            ...question,
            answers: answersMap[question.MaCauHoi] || []
        }));

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

    // Find questions by CLO ID and creator
    async findByMaCLOAndCreator(maCLO: string, creatorId: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: {
                MaCLO: maCLO,
                MaCauHoiCha: IsNull(), // Only return parent questions
                NguoiTao: creatorId // Only return questions created by this user
            },
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
}
