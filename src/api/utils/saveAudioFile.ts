
import { Request } from 'express';

export default function saveAudioFile(req: Request) {
    if (!req.file) {
        throw new Error('No file provided!');
    }
    const uploadedAudioFile = req.file;
    return uploadedAudioFile.filename
}