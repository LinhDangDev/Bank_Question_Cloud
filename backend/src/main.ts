import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
import { getCurrentDatabaseEnvironment } from './config/database.config';

// Improved function to find and load .env file
const loadEnvFile = () => {
    // Define all possible locations for .env
    const possiblePaths = [
        path.resolve(process.cwd(), '.env'), // Root of the project
        path.resolve(__dirname, '..', '.env'), // Backend folder (from dist/src)
        path.resolve(__dirname, '.env'), // Current directory
    ];

    let envFilePath;

    // Find the first path that exists
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            envFilePath = p;
            break;
        }
    }

    if (envFilePath) {
        console.log(`✅ Found .env file at: ${envFilePath}`);
        dotenv.config({ path: envFilePath });

        // Copy to dist folder to ensure it's available after build
        const distPath = path.resolve(process.cwd(), 'dist', '.env');
        try {
            fs.copyFileSync(envFilePath, distPath);
            console.log(`✅ Copied .env file to: ${distPath}`);
        } catch (error) {
            console.warn(`⚠️ Could not copy .env file to dist: ${error.message}`);
        }
        return true;
    } else {
        console.warn('⚠️ No .env file found. Using default environment variables.');
        return false;
    }
};

async function bootstrap() {
    // Load environment variables first thing
    loadEnvFile();

    // Create the Nest application
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS
    app.enableCors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept",
    });

    // Global validation
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            transformOptions: { enableImplicitConversion: true },
            exceptionFactory: (errors) => {
                // Tạo thông báo lỗi chi tiết hơn với tên trường và thông báo
                const formattedErrors = errors.map(err => {
                    // Lấy ràng buộc đầu tiên (thường là quan trọng nhất)
                    const constraints = err.constraints ? Object.values(err.constraints) : ['Lỗi validation'];
                    const firstConstraint = constraints[0];

                    // Định dạng thông báo lỗi
                    return `${err.property}: ${firstConstraint}`;
                });

                return new BadRequestException({
                    message: formattedErrors,
                    error: 'Bad Request',
                    statusCode: 400
                });
            }
        }),
    );

    // Serve static files from public directory
    const publicPath = path.resolve(__dirname, '../public');

    // Create the public directory if it doesn't exist
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }

    app.use(express.static(publicPath));

    // Serve uploaded files (audio, images) as static files
    const uploadsPath = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
    }

    // Make uploads accessible via /uploads route
    app.use('/uploads', express.static(uploadsPath));

    // Set global prefix
    app.setGlobalPrefix('api');

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Question Bank API')
        .setDescription('API documentation for the Question Bank System')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        customSiteTitle: 'Question Bank API Docs',
        customfavIcon: 'https://nestjs.com/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
    });

    // Write swagger.json file for external tools
    fs.writeFileSync("./swagger.json", JSON.stringify(document, null, 2));

    // Start server
    const port = process.env.PORT || 3000;
    const dbEnv = getCurrentDatabaseEnvironment();
    await app.listen(port);

    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📄 API Documentation: http://localhost:${port}/api`);
    console.log(`🔄 Using ${dbEnv.toUpperCase()} database environment`);
    console.log(`🔧 DB Switcher: http://localhost:${port}/db-switcher.html`);
}

bootstrap();
