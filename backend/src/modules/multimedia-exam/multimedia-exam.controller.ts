import { Controller, Get, Param, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MultimediaExamService, MultimediaExamResponse } from './multimedia-exam.service';

@ApiTags('Multimedia Exam API')
@Controller('multimedia-exam')
export class MultimediaExamController {
    private readonly logger = new Logger(MultimediaExamController.name);

    constructor(
        private readonly multimediaExamService: MultimediaExamService
    ) { }

    @Get('approved-exams')
    @ApiOperation({
        summary: 'Lấy danh sách đề thi đã duyệt',
        description: 'API để lấy danh sách tất cả đề thi đã được duyệt. API này không cần authentication.'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy danh sách đề thi đã duyệt thành công'
    })
    async getApprovedExams(): Promise<{ MaDeThi: string; TenDeThi: string; NgayTao: string }[]> {
        try {
            this.logger.log('API call: GET /api/multimedia-exam/approved-exams');
            
            const exams = await this.multimediaExamService.getApprovedExams();
            
            this.logger.log(`Successfully returned ${exams.length} approved exams`);
            return exams;

        } catch (error) {
            this.logger.error('Error in getApprovedExams:', error);
            
            throw new HttpException({
                success: false,
                message: 'Lỗi hệ thống khi lấy danh sách đề thi đã duyệt',
                error: 'INTERNAL_SERVER_ERROR'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('exam/:maDeThi')
    @ApiOperation({
        summary: 'Lấy chi tiết đề thi với multimedia',
        description: 'API để lấy thông tin chi tiết đề thi đã duyệt bao gồm câu hỏi, câu trả lời và multimedia files. API này không cần authentication.'
    })
    @ApiParam({
        name: 'maDeThi',
        description: 'Mã đề thi cần lấy thông tin',
        example: 'BBB33582-64B9-400D-80A8-3B9A5FA1665F'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thông tin đề thi thành công'
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đề thi hoặc đề thi chưa được duyệt'
    })
    async getExamWithMultimedia(@Param('maDeThi') maDeThi: string): Promise<MultimediaExamResponse> {
        try {
            this.logger.log(`API call: GET /api/multimedia-exam/exam/${maDeThi}`);

            if (!maDeThi || maDeThi.trim() === '') {
                throw new HttpException({
                    success: false,
                    message: 'Mã đề thi không được để trống',
                    error: 'INVALID_EXAM_ID'
                }, HttpStatus.BAD_REQUEST);
            }

            const examData = await this.multimediaExamService.getApprovedExamWithMultimedia(maDeThi.trim());

            this.logger.log(`Successfully returned exam details for: ${maDeThi}`);
            return examData;

        } catch (error) {
            this.logger.error(`Error in getExamWithMultimedia for ${maDeThi}:`, error);

            if (error instanceof HttpException) {
                throw error;
            }

            if (error.message === 'Exam not found or not approved') {
                throw new HttpException({
                    success: false,
                    message: 'Không tìm thấy đề thi hoặc đề thi chưa được duyệt',
                    error: 'EXAM_NOT_FOUND'
                }, HttpStatus.NOT_FOUND);
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi hệ thống khi lấy thông tin đề thi',
                error: 'INTERNAL_SERVER_ERROR'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('health')
    @ApiOperation({
        summary: 'Health check',
        description: 'Kiểm tra tình trạng hoạt động của Multimedia Exam API'
    })
    @ApiResponse({
        status: 200,
        description: 'API hoạt động bình thường'
    })
    async healthCheck() {
        this.logger.log('Health check called');
        return {
            success: true,
            message: 'Multimedia Exam API is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    @Get('test/:maDeThi')
    @ApiOperation({
        summary: 'Test endpoint',
        description: 'Endpoint để test kết nối và format dữ liệu trả về'
    })
    @ApiParam({
        name: 'maDeThi',
        description: 'Mã đề thi để test',
        example: 'BBB33582-64B9-400D-80A8-3B9A5FA1665F'
    })
    async testEndpoint(@Param('maDeThi') maDeThi: string) {
        this.logger.log(`Test endpoint called with: ${maDeThi}`);

        try {
            const examList = await this.getApprovedExams();
            const examDetails = await this.getExamWithMultimedia(maDeThi);

            return {
                success: true,
                message: 'Test completed successfully',
                timestamp: new Date().toISOString(),
                results: {
                    approvedExamsCount: examList.length,
                    examDetailsFound: !!examDetails,
                    maDeThi: maDeThi
                }
            };
        } catch (error) {
            return {
                success: false,
                message: 'Test failed',
                timestamp: new Date().toISOString(),
                error: error.message,
                maDeThi: maDeThi
            };
        }
    }
}
