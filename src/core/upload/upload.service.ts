import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    private uploadDir = path.join(process.cwd(), 'uploads');

    async saveFile(file: Express.Multer.File): Promise<{ filename: string; url: string }> {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(this.uploadDir, filename);

        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        fs.writeFileSync(filepath, file.buffer);

        return {
            filename,
            url: `/uploads/${filename}`,
        };
    }

    async getFile(filename: string): Promise<{ filepath: string; exists: boolean }> {
        const filepath = path.join(this.uploadDir, filename);
        return { filepath, exists: fs.existsSync(filepath) };
    }
}
