import { Controller, Get, Param, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IntegrationService } from '../../services/integration.service';
import {
    ExamDetailsResponseDto,
    ExamStatusResponseDto,
    ApiResponseDto
} from '../../dto/integration.dto';

@ApiTags('Integration API')
@Controller('integration')
export class IntegrationController {
    private readonly logger = new Logger(IntegrationController.name);

    constructor(
        private readonly integrationService: IntegrationService
    ) { }

    @Get('exam-details/:maDeThi')
    @ApiOperation({
        summary: 'Lấy chi tiết đề thi',
        description: 'API để lấy thông tin chi tiết đề thi bao gồm câu hỏi và câu trả lời theo format JSON yêu cầu. API này không cần authentication.'
    })
    @ApiParam({
        name: 'maDeThi',
        description: 'Mã đề thi cần lấy thông tin',
        example: '0000-0000-0001'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thông tin đề thi thành công',
        type: ApiResponseDto<ExamDetailsResponseDto>
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đề thi'
    })
    @ApiResponse({
        status: 500,
        description: 'Lỗi hệ thống'
    })
    async getExamDetails(@Param('maDeThi') maDeThi: string): Promise<ApiResponseDto<ExamDetailsResponseDto>> {
        try {
            this.logger.log(`API call: GET /api/integration/exam-details/${maDeThi}`);

            if (!maDeThi || maDeThi.trim() === '') {
                throw new HttpException({
                    success: false,
                    message: 'Mã đề thi không được để trống',
                    error: 'INVALID_EXAM_ID'
                }, HttpStatus.BAD_REQUEST);
            }

            const result = await this.integrationService.getExamDetails(maDeThi.trim());

            if (!result.success) {
                const statusCode = result.error === 'EXAM_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
                throw new HttpException(result, statusCode);
            }

            this.logger.log(`Successfully returned exam details for: ${maDeThi}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getExamDetails for ${maDeThi}:`, error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi hệ thống khi lấy thông tin đề thi',
                error: 'INTERNAL_SERVER_ERROR'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('exam-status/:maDeThi')
    @ApiOperation({
        summary: 'Kiểm tra trạng thái đề thi',
        description: 'API để kiểm tra trạng thái đề thi (ready, processing, error) và thông tin cơ bản. API này không cần authentication.'
    })
    @ApiParam({
        name: 'maDeThi',
        description: 'Mã đề thi cần kiểm tra trạng thái',
        example: '0000-0000-0001'
    })
    @ApiResponse({
        status: 200,
        description: 'Kiểm tra trạng thái thành công',
        type: ApiResponseDto<ExamStatusResponseDto>
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đề thi'
    })
    @ApiResponse({
        status: 500,
        description: 'Lỗi hệ thống'
    })
    async getExamStatus(@Param('maDeThi') maDeThi: string): Promise<ApiResponseDto<ExamStatusResponseDto>> {
        try {
            this.logger.log(`API call: GET /api/integration/exam-status/${maDeThi}`);

            if (!maDeThi || maDeThi.trim() === '') {
                throw new HttpException({
                    success: false,
                    message: 'Mã đề thi không được để trống',
                    error: 'INVALID_EXAM_ID'
                }, HttpStatus.BAD_REQUEST);
            }

            const result = await this.integrationService.getExamStatus(maDeThi.trim());

            if (!result.success) {
                const statusCode = result.error === 'EXAM_NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
                throw new HttpException(result, statusCode);
            }

            this.logger.log(`Successfully returned exam status for: ${maDeThi}`);
            return result;

        } catch (error) {
            this.logger.error(`Error in getExamStatus for ${maDeThi}:`, error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi hệ thống khi kiểm tra trạng thái đề thi',
                error: 'INTERNAL_SERVER_ERROR'
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('health')
    @ApiOperation({
        summary: 'Health check',
        description: 'Kiểm tra tình trạng hoạt động của Integration API'
    })
    @ApiResponse({
        status: 200,
        description: 'API hoạt động bình thường'
    })
    async healthCheck() {
        this.logger.log('Health check called');
        return {
            success: true,
            message: 'Integration API is running',
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
        example: '0000-0000-0001'
    })
    async testEndpoint(@Param('maDeThi') maDeThi: string) {
        this.logger.log(`Test endpoint called with: ${maDeThi}`);

        const examDetails = await this.getExamDetails(maDeThi);
        const examStatus = await this.getExamStatus(maDeThi);

        return {
            success: true,
            message: 'Test completed successfully',
            timestamp: new Date().toISOString(),
            results: {
                examDetails: examDetails.success,
                examStatus: examStatus.success,
                maDeThi: maDeThi
            }
        };
    }
}
