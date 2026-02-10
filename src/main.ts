import * as crypto from 'crypto';
if (!global.crypto) { (global as any).crypto = crypto; }

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    try {
        const app = await NestFactory.create<NestExpressApplication>(AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });

        // Create uploads folder if not exists
        const fs = await import('fs');
        const uploadDir = join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Serve Static Assets (Uploads)
        app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

        // Increase body size limit
        const bodyParser = await import('body-parser');
        app.use(bodyParser.json({ limit: '50mb' }));
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

        // Enable /api prefix
        app.setGlobalPrefix('api');

        // Enable CORS
        app.enableCors({
            origin: [
                'http://localhost:3001',
                'http://localhost:3002',
                'http://localhost:5173',
            ],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });

        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`🏥 Hula Clinic ERP is running on: ${await app.getUrl()}`);
    } catch (err) {
        console.error('FATAL STARTUP ERROR:', err);
        process.exit(1);
    }
}
bootstrap();
