import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './controller/files.controller';
import { AwsS3Service } from './service/aws-s3.service';
import { QdrantService } from './service/qdrant.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'your-sql-server-host',
      port: 1433,
      username: 'your-username',
      password: 'your-password',
      database: 'your-database',
    }),
  ],
  controllers: [AppController, FilesController],
  providers: [AppService, AwsS3Service, QdrantService],
})
export class AppModule {}
