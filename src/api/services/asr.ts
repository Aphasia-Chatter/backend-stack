import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import saveAudioFile from '../utils/saveAudioFile';

const openai = new OpenAI({
    organization: `${process.env.OPENAI_ORGANIZATION}`,
    project: `${process.env.OPENAI_PROJECT}`
})

export async function transcribe(req: Request, res: Response) {
    /*
        PROCESS:

        1. Receive the POST request
        2. Call 'saveAudioFile()', which saves the file into the 'audios' directory and reads the file name 
        3. 
    */
   const fileName = saveAudioFile(req);
   const audioFileDir = path.join(__dirname, '../../audios')
   const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(path.join(audioFileDir, fileName)),
        model: "whisper-1"
    });
    return transcription.text
}