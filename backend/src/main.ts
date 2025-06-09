import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors();

    // Add validation pipe
    app.useGlobalPipes(new ValidationPipe());

    // Swagger configuration
    const config = new DocumentBuilder()
        .setTitle('Question Bank API')
        .setDescription('API documentation for the Question Bank system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
