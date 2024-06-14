import e, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from 'src/db';
import { wordRetrievalTask } from 'src/schema';
import { eq } from 'drizzle-orm';

export async function verify(req: Request, res: Response): Promise<Response> {
    const request = req.body;
    try {
        /* 
            Send JSON body, consisting of the word_retrieval_task_id (which contains the correct answer)
            and the user's answer
        */
        const word_retrieval_task_id = request["word_retrieval_task_id"];
        const user_answer = request["user_answer"];
        // Query from database first
        const result = await db.select().from(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, word_retrieval_task_id));
        console.log(`Actual Answer: ${result[0]['answer']}`)
        if (result[0]['answer'] === user_answer) {
            return res.status(200).json({
                status: "SUCCESS",
                user_answer: user_answer,
                task: result[0],
                correct: true
            })
        } else if (result[0]['answer'] != user_answer) {
            /*
                 TODO: 
                 
                 1. Compare user_answer and result[0]['answer'] for similarity
                 2. If semantically similar, look up database for cues
                 3. If there are no cues present, generate using OpenAI GPT and store it in the DB
                 4. Return JSON containing the cues
            */
            return res.status(200).json({
                status: "SUCCESS",
                task: result[0],
                correct: false,
                messages: []
            })
        } else {
            return res.status(400).json({
                status: "FAILURE",
                message: "Task not found."
            })
        }
    } catch(error: any) {
        return res.status(400).json({
            status: "FAILURE"
        })
    }
}