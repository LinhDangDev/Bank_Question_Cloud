import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YeuCauRutTrich } from '../../../entities/yeu-cau-rut-trich.entity';
import { ExamService } from '../../../services/exam.service';

@Processor('extraction')
export class ExtractionProcessor {
    private readonly logger = new Logger(ExtractionProcessor.name);

    constructor(
        @InjectRepository(YeuCauRutTrich)
        private readonly yeuCauRutTrichRepository: Repository<YeuCauRutTrich>,
        private readonly examService: ExamService,
    ) { }

    @Process('extract-exam')
    async handleExamExtraction(job: Job<{ requestId: string }>) {
        try {
            this.logger.log(`Processing extraction job ${job.id} for request ${job.data.requestId}`);

            // 1. Get the extraction request
            const request = await this.yeuCauRutTrichRepository.findOne({
                where: { MaYeuCau: job.data.requestId },
            });
            if (!request) {
                throw new Error(`Request with ID ${job.data.requestId} not found`);
            }
            // 2. Parse the request data
            const requestData = JSON.parse(request.NoiDungRutTrich || '{}');
            // 3. Generate the exam (enforcing soLuongDe = 1 for performance)
            const result = await this.examService.generateExam({
                maMonHoc: requestData.maMonHoc,
                tenDeThi: requestData.tenDeThi,
                matrix: requestData.matrix,
                hoanViDapAn: requestData.hoanViDapAn || false,
                nguoiTao: request.HoTenGiaoVien || 'Unknown',
                soLuongDe: 1 // Force to 1 to ensure performance
            });
            // 4. Update the request with the result
            await this.yeuCauRutTrichRepository.update(job.data.requestId, {
                NoiDungRutTrich: JSON.stringify({
                    ...requestData,
                    result: {
                        deThiId: result.deThiIds[0],
                        docxPath: result.docxPaths[0],
                        pdfPath: result.pdfPaths[0],
                        status: 'completed',
                    },
                }),
            });
            this.logger.log(`Extraction job ${job.id} completed successfully`);
            return {
                success: true,
                deThiId: result.deThiIds[0],
            };
        } catch (error) {
            this.logger.error(`Error processing extraction job ${job.id}: ${error.message}`, error.stack);
            // Update the request with error information
            try {
                await this.yeuCauRutTrichRepository.update(job.data.requestId, {
                    NoiDungRutTrich: JSON.stringify({
                        error: error.message,
                        status: 'failed',
                    }),
                });
            } catch (updateError) {
                this.logger.error(`Failed to update request status: ${updateError.message}`);
            }
            throw error;
        }
    }
}
