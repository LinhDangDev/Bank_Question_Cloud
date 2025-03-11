import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsS3Service } from '../service/aws-s3.service';


@Controller('files')
export class FilesController {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      // Tùy chọn: lưu tạm file vào disk
      // storage: diskStorage({
      //   destination: './uploads',
      //   filename: (req, file, cb) => {
      //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      //     cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      //   },
      // }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new InternalServerErrorException('File is required');
      }

      const bucketName = process.env.AWS_S3_BUCKET;
      const url = await this.awsS3Service.uploadFile(file, bucketName);
      return { url };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }
}
