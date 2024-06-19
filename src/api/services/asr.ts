import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const openai = new OpenAI({
    organization: `${process.env.OPENAI_ORGANIZATION}`,
    project: `${process.env.OPENAI_PROJECT}`
})

const __dirname = dirname('');

export async function transcribe(req: Request, res: Response): Promise<Response> {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "FAILURE", message: `No file uploaded. ${req.file}` });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;
        const destinationDir = path.join(__dirname, '../../audios');
        const destinationPath = path.join(destinationDir, fileName);

        // Ensure the destination directory exists
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }
        
        // Copy file to the destination directory
        fs.copyFileSync(filePath, destinationPath);

        // Ensure the file exists
        if (!fs.existsSync(destinationPath)) {
            return res.status(500).json({
                status: "FAILURE",
                message: "Audio file could not be saved or does not exist.",
                path: `${destinationPath}`
            });
        }

        // Call the OpenAI Whisper Model to transcribe the audio
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(destinationPath),
            model: "whisper-1"
        });

        // Return the transcribed text
        return res.status(200).json({
            status: "SUCCESS",
            transcription: transcription.text
        });
    
    } catch (error: any) {
        // Error handling
        console.error("Error during transcription process:", error);

        let errorMessage = `${error}`;
        let statusCode = 500;

        if (error.response && error.response.data) {
            // Error from OpenAI API
            errorMessage = `OpenAI API error: ${error.response.data.error.message}`;
            statusCode = error.response.status;
        } else if (error.message.includes('ENOENT')) {
            // File not found error
            errorMessage = 'Audio file not found.';
            statusCode = 404;
        } else if (error.message.includes('EACCES')) {
            // Permission error
            errorMessage = 'Permission denied when accessing the audio file.';
            statusCode = 403;
        } else if (error.code === 'ENOTFOUND') {
            // Network-related error
            errorMessage = 'Network error occurred while accessing OpenAI API.';
            statusCode = 503;
        }

        return res.status(statusCode).json({
            status: "FAILURE",
            message: errorMessage
        });
    }
}
