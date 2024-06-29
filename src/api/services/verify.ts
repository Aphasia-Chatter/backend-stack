import { Request, Response } from 'express';
import { db } from 'src/db';
import { wordRetrievalTask, wordRetrievalTaskHint, wordRetrievalHintTypeEnum } from 'src/schema';
import { eq } from 'drizzle-orm';
import tokenizeAnswer from '../utils/languageProcessor/tokenizeAnswer';
import invoke from '../utils/llm/invoke';
import insertWordRetrevialTaskHint from '../repositories/insertWordRetrievalTaskHint';

export async function verify(req: Request, res: Response): Promise<Response> {
    const request = req.body;
    try {
        /* 
            Send JSON body, consisting of the word_retrieval_task_id (which contains the correct answer)
            and the user's answer
        */
        const word_retrieval_task_id = request["word_retrieval_task_id"];
        const user_answer = request["user_answer"];
        // Retrieve the words from the user_answer (ASR may pick up several words)
        const words = tokenizeAnswer(user_answer);

        console.log(words);

        // Query from database first
        const result = await db.select().from(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, word_retrieval_task_id));
        console.log(`Actual Answer: ${result[0]['answer']}`)

        for (let i = 0; i < words.length; i++) {
            if (result[0]['answer'] === words[i]) {
                const response = await invoke(`
                    The target answer is ${result[0]['answer']}. Write a congratulatory message 
                    telling the user that he/she got the right answer, and give a short one sentence
                    description of the target answer.
                `);
                return res.status(200).json({
                    status: "SUCCESS",
                    user_answer: user_answer,
                    task: result[0],
                    correct: true,
                    messages: response    // Response for correct answer
                }) 
            }
        }
        
        // Case 2: Wrong answer
        
        // Fetch cues from database
        const result_cues = await db.select().from(wordRetrievalTaskHint).where(eq(wordRetrievalTaskHint.taskID, word_retrieval_task_id));
        
        // const result_cues_all = await db.select().from(wordRetrievalTaskHint) // To get all the word_retrieval_task, as all IDs have to be unique
        const cues: any[] = [];

        // Insert cues fetched from database into the cues array
        for (let i = 0; i < result_cues.length; i++) {
            cues.push(result_cues[i]);
        }
        
        return res.status(200).json({
            status: "SUCCESS",
            task: result[0],
            correct: false,
            cues: cues // Includes the content and the hierarchy number
        })
        
    } catch(error: any) {
        return res.status(400).json({
            status: "FAILURE",
            message: "Task not found."
        })
    }
}