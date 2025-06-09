import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CreateCauHoiDto, UpdateCauHoiDto, CreateQuestionWithAnswersDto, UpdateQuestionWithAnswersDto } from '../../dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { In } from 'typeorm';

@Injectable()
export class CauHoiService extends BaseService<CauHoi> {
    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        private readonly dataSource: DataSource,
    ) {
        super(cauHoiRepository, 'MaCauHoi');
    }

    async findAll(paginationDto: PaginationDto) {
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
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
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };
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

    async createCauHoi(createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        const cauHoi = this.cauHoiRepository.create({
            ...createCauHoiDto,
            NgayTao: new Date(),
        });
        return await this.cauHoiRepository.save(cauHoi);
    }

    async createQuestionWithAnswers(dto: CreateQuestionWithAnswersDto): Promise<{ question: CauHoi, answers: CauTraLoi[] }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create the question
            const questionData = {
                ...dto.question,
                NgayTao: new Date(),
            };
            const question = queryRunner.manager.create(CauHoi, questionData);
            const savedQuestion = await queryRunner.manager.save(question);

            // Create the answers
            const answers = dto.answers.map(answerDto => {
                return queryRunner.manager.create(CauTraLoi, {
                    ...answerDto,
                    MaCauHoi: savedQuestion.MaCauHoi,
                });
            });
            const savedAnswers = await queryRunner.manager.save(answers);

            await queryRunner.commitTransaction();
            return { question: savedQuestion, answers: savedAnswers };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateCauHoi(id: string, updateCauHoiDto: UpdateCauHoiDto): Promise<CauHoi> {
        await this.findOne(id);
        await this.cauHoiRepository.update(id, {
            ...updateCauHoiDto,
            NgaySua: new Date(),
        });
        return await this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        await this.cauHoiRepository.remove(cauHoi);
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

    async updateQuestionWithAnswers(id: string, dto: UpdateQuestionWithAnswersDto): Promise<{ question: CauHoi, answers: CauTraLoi[] }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if question exists
            const existingQuestion = await this.findOne(id);

            // Update the question
            const questionData = {
                ...dto.question,
                NgaySua: new Date(),
            };
            await queryRunner.manager.update(CauHoi, id, questionData);
            const updatedQuestion = await queryRunner.manager.findOne(CauHoi, { where: { MaCauHoi: id } });

            if (!updatedQuestion) {
                throw new NotFoundException(`Question with ID ${id} not found after update`);
            }

            // Delete existing answers
            await queryRunner.manager.delete(CauTraLoi, { MaCauHoi: id });

            // Create new answers
            const answers = dto.answers.map(answerDto => {
                return queryRunner.manager.create(CauTraLoi, {
                    ...answerDto,
                    MaCauHoi: id,
                });
            });
            const savedAnswers = await queryRunner.manager.save(answers);

            await queryRunner.commitTransaction();
            return { question: updatedQuestion, answers: savedAnswers };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByMaPhanWithAnswers(maPhan: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;

        // Get questions for the section
        const [questions, total] = await this.cauHoiRepository.findAndCount({
            where: { MaPhan: maPhan },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
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

        // Combine questions with their answers
        const items = questions.map(question => ({
            question,
            answers: answersMap[question.MaCauHoi] || [],
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
}
