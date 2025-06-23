import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CauHoiService } from './cau-hoi.service';
import { CreateCauHoiDto, UpdateCauHoiDto, CreateQuestionWithAnswersDto, UpdateQuestionWithAnswersDto, CreateGroupQuestionDto } from '../../dto';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { PaginationDto } from '../../dto/pagination.dto';
import { CreateCauTraLoiDto } from 'src/dto/cau-tra-loi.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';

@ApiTags('cau-hoi')
@Controller('cau-hoi')
export class CauHoiController {
    constructor(private readonly cauHoiService: CauHoiService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get all questions with pagination' })
    @ApiResponse({ status: 200, description: 'Return all questions with pagination' })
    async findAll(
        @Query() paginationDto: PaginationDto,
        @Query('includeAnswers') includeAnswers?: boolean,
        @Query('answersPage') answersPage?: number,
        @Query('answersLimit') answersLimit?: number,
    ) {
        const answersPagination = answersPage || answersLimit ? {
            page: answersPage || 1,
            limit: answersLimit || 10
        } : undefined;

        return await this.cauHoiService.findAll(
            paginationDto,
            includeAnswers,
            answersPagination
        );
    }

    @Get('group')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get all group questions with child questions and answers' })
    @ApiResponse({ status: 200, description: 'Return all group questions with child questions and answers' })
    async findGroupQuestions(
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findGroupQuestions(paginationDto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get a question by ID' })
    @ApiResponse({ status: 200, description: 'Return a question by ID' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async findOne(@Param('id') id: string): Promise<CauHoi> {
        return await this.cauHoiService.findOne(id);
    }

    @Get(':id/with-answers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get a question with its answers' })
    @ApiResponse({ status: 200, description: 'Return a question with its answers' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async findOneWithAnswers(@Param('id') id: string) {
        return await this.cauHoiService.findOneWithAnswers(id);
    }

    @Get(':id/full-details')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get a question with full details including faculty, subject, section, and CLO' })
    @ApiResponse({ status: 200, description: 'Return a question with full details' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async findOneWithFullDetails(@Param('id') id: string) {
        return await this.cauHoiService.findOneWithFullDetails(id);
    }

    @Get('phan/:maPhan')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get questions by section ID' })
    @ApiResponse({ status: 200, description: 'Return questions by section ID' })
    @ApiParam({ name: 'maPhan', description: 'Section ID' })
    async findByMaPhan(
        @Param('maPhan') maPhan: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByMaPhan(maPhan, paginationDto);
    }

    @Get('phan/:maPhan/with-answers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get questions with answers by section ID' })
    @ApiResponse({ status: 200, description: 'Return questions with answers by section ID' })
    @ApiParam({ name: 'maPhan', description: 'Section ID' })
    async findByMaPhanWithAnswers(
        @Param('maPhan') maPhan: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByMaPhanWithAnswers(maPhan, paginationDto);
    }

    @Get('clo/:maCLO')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get questions by CLO ID' })
    @ApiResponse({ status: 200, description: 'Return questions by CLO ID' })
    @ApiParam({ name: 'maCLO', description: 'CLO ID' })
    async findByMaCLO(
        @Param('maCLO') maCLO: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByMaCLO(maCLO, paginationDto);
    }

    @Get('con/:maCauHoiCha')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Get child questions by parent question ID' })
    @ApiResponse({ status: 200, description: 'Return child questions by parent question ID' })
    @ApiParam({ name: 'maCauHoiCha', description: 'Parent question ID' })
    async findByCauHoiCha(
        @Param('maCauHoiCha') maCauHoiCha: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByCauHoiCha(maCauHoiCha, paginationDto);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Create a new question' })
    @ApiResponse({ status: 201, description: 'The question has been successfully created' })
    @ApiBody({ type: CreateCauHoiDto })
    async create(@Body() createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        return await this.cauHoiService.create(createCauHoiDto);
    }

    @Post('with-answers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Create a new question with answers' })
    @ApiResponse({ status: 201, description: 'The question with answers has been successfully created' })
    @ApiBody({ type: CreateQuestionWithAnswersDto })
    async createWithAnswers(@Body() dto: CreateQuestionWithAnswersDto) {
        return this.cauHoiService.createQuestionWithAnswers(dto);
    }

    @Post('group')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Create a group question with child questions and answers' })
    async createGroupQuestion(@Body() dto: CreateGroupQuestionDto) {
        try {
            const result = await this.cauHoiService.createGroupQuestion(dto);
            return {
                success: true,
                message: 'Tạo câu hỏi nhóm thành công',
                data: result
            };
        } catch (error) {
            console.error('Lỗi tạo câu hỏi nhóm:', error);
            throw new HttpException({
                success: false,
                message: `Lỗi tạo câu hỏi nhóm: ${error.message}`,
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Update a question' })
    @ApiResponse({ status: 200, description: 'The question has been successfully updated' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiBody({ type: UpdateCauHoiDto })
    async update(
        @Param('id') id: string,
        @Body() updateCauHoiDto: UpdateCauHoiDto,
    ): Promise<CauHoi> {
        return await this.cauHoiService.update(id, updateCauHoiDto);
    }

    @Put(':id/with-answers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Update a question with answers' })
    @ApiResponse({ status: 200, description: 'The question with answers has been successfully updated' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    @ApiBody({ type: UpdateQuestionWithAnswersDto })
    async updateWithAnswers(
        @Param('id') id: string,
        @Body() dto: UpdateQuestionWithAnswersDto,
    ) {
        return await this.cauHoiService.updateQuestionWithAnswers(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Delete a question' })
    @ApiResponse({ status: 200, description: 'The question has been successfully deleted' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async remove(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.delete(id);
    }

    @Patch(':id/soft-delete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Soft delete a question' })
    @ApiResponse({ status: 200, description: 'The question has been successfully soft deleted' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async softDelete(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.softDeleteCauHoi(id);
    }

    @Patch(':id/restore')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Restore a soft deleted question' })
    @ApiResponse({ status: 200, description: 'The question has been successfully restored' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    @ApiParam({ name: 'id', description: 'Question ID' })
    async restore(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.restoreCauHoi(id);
    }
}
