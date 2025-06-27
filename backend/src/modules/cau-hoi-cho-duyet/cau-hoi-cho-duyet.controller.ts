import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CauHoiChoDuyetService } from './cau-hoi-cho-duyet.service';
import {
    CreateCauHoiChoDuyetDto,
    UpdateCauHoiChoDuyetDto,
    DuyetCauHoiDto
} from '../../dto/cau-hoi-cho-duyet.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CauHoi } from '../../entities/cau-hoi.entity';

// Define result interface to fix TypeScript errors
interface ProcessResult {
    id: string;
    success: boolean;
    cauHoi?: CauHoi | null;
    error?: string;
}

@ApiTags('cau-hoi-cho-duyet')
@Controller('cau-hoi-cho-duyet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CauHoiChoDuyetController {
    constructor(private readonly cauHoiChoDuyetService: CauHoiChoDuyetService) { }

    @Get()
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Lấy danh sách câu hỏi chờ duyệt' })
    async findAll(
        @Query() paginationDto: PaginationDto,
        @Query('trangThai') trangThai?: number,
        @Query('nguoiTao') nguoiTao?: string,
        @Request() req?: any
    ) {
        // Nếu là teacher, chỉ xem câu hỏi của mình
        const user = req.user;
        let filterNguoiTao = nguoiTao;

        if (user.role === 'teacher') {
            filterNguoiTao = user.sub; // user.sub là userId
        }

        return await this.cauHoiChoDuyetService.findAll(
            paginationDto,
            trangThai ? Number(trangThai) : undefined,
            filterNguoiTao
        );
    }

    @Get('statistics')
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Lấy thống kê câu hỏi chờ duyệt' })
    async getStatistics(@Request() req: any) {
        const user = req.user;
        let nguoiTao: string | undefined;

        if (user.role === 'teacher') {
            nguoiTao = user.sub; // Chỉ thống kê câu hỏi của teacher này
        }

        return await this.cauHoiChoDuyetService.getStatistics(nguoiTao);
    }

    @Get(':id')
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Lấy chi tiết câu hỏi chờ duyệt' })
    async findOne(@Param('id') id: string, @Request() req: any) {
        const cauHoi = await this.cauHoiChoDuyetService.findOne(id);
        const user = req.user;

        // Nếu là teacher, chỉ được xem câu hỏi của mình
        if (user.role === 'teacher' && cauHoi.NguoiTao !== user.sub) {
            throw new Error('Bạn không có quyền xem câu hỏi này');
        }

        return cauHoi;
    }

    @Post()
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Tạo câu hỏi chờ duyệt' })
    async create(@Body() createDto: CreateCauHoiChoDuyetDto, @Request() req: any) {
        const user = req.user;
        createDto.NguoiTao = user.sub; // Gán người tạo là user hiện tại
        return await this.cauHoiChoDuyetService.create(createDto);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Cập nhật câu hỏi chờ duyệt (chỉ admin)' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateCauHoiChoDuyetDto
    ) {
        return await this.cauHoiChoDuyetService.update(id, updateDto);
    }

    @Post('duyet')
    @Roles('admin')
    @ApiOperation({ summary: 'Duyệt hoặc từ chối câu hỏi' })
    @ApiResponse({ status: 200, description: 'Duyệt thành công' })
    async duyetCauHoi(@Body() duyetDto: DuyetCauHoiDto, @Request() req: any) {
        const user = req.user;
        const result = await this.cauHoiChoDuyetService.duyetCauHoi(duyetDto, user.sub);

        if (duyetDto.TrangThai === 1) {
            return {
                message: 'Duyệt câu hỏi thành công',
                cauHoi: result
            };
        } else {
            return {
                message: 'Từ chối câu hỏi thành công'
            };
        }
    }

    @Post('duyet-nhieu')
    @Roles('admin')
    @ApiOperation({ summary: 'Duyệt nhiều câu hỏi cùng lúc' })
    async duyetNhieuCauHoi(
        @Body() payload: {
            cauHoiIds: string[];
            trangThai: number;
            ghiChu?: string;
            maPhan?: string;
        },
        @Request() req: any
    ) {
        const user = req.user;
        const results: ProcessResult[] = [];

        for (const id of payload.cauHoiIds) {
            try {
                const duyetDto: DuyetCauHoiDto = {
                    MaCauHoiChoDuyet: id,
                    TrangThai: payload.trangThai,
                    GhiChu: payload.ghiChu,
                    MaPhan: payload.maPhan
                };

                const result = await this.cauHoiChoDuyetService.duyetCauHoi(duyetDto, user.sub);
                results.push({
                    id,
                    success: true,
                    cauHoi: result
                });
            } catch (error) {
                results.push({
                    id,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            message: 'Xử lý hoàn tất',
            results
        };
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Xóa câu hỏi chờ duyệt (chỉ admin)' })
    async remove(@Param('id') id: string) {
        await this.cauHoiChoDuyetService.remove(id);
        return { message: 'Xóa câu hỏi chờ duyệt thành công' };
    }
}
