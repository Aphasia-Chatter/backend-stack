import invoke from '../utils/llm/invoke';
import { db } from 'src/db';
import { count, eq } from 'drizzle-orm';
import { wordRetrievalTask, wordRetrievalTaskHint } from 'src/schema';
import insertWordRetrevialTaskHint from '../repositories/insertWordRetrievalTaskHint';
import { Request, Response } from 'express';


export async function generateCues(req: Request, res: Response, type: string): Promise<Response> {
    const request = req.body;
    var word_retrieval_task_id: any = null;
    var num_cues: number = 0;
    try {
        word_retrieval_task_id = request["word_retrieval_task_id"];
        num_cues = request["num_cues"];
        // Fetch word from database
        const result = await db.select().from(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, word_retrieval_task_id));
        // Select count of cues from database
        const count_cues = await db.select({ count: count() }).from(wordRetrievalTaskHint);
        const cues: any[] = [];
        if (type === 'phonetic') {
            await invoke(`
                Generate ${num_cues} phonetic cues for getting aphasia patient to recall the target word: ${result[0]['answer']}

                Below are several examples of phonetic cues for the target word "Table":
                
                Ta_ _ _, what's the last three letters?
                Starts with T
                Ta_ _ _, where do you put your plate on?
                Ta_ _ _, has four legs.

                Format like above. [Note: _  represents the missing letters. So for Table, it would be "Ta_ _ _", and Cat would be "C_ _"]
                
                Exclude the quotation marks. I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(i + count_cues[0].count, word_retrieval_task_id, cues[i], "message");
                }
            })
        } else if (type === 'semantic') {
            await invoke(`
                Generate ${num_cues} semantic cues for getting aphasia patient to recall the target word: ${result[0]['answer']}

                Below are several examples of cues for the target word "Cat":
                
                What is Tom from Tom and Jerry?
                Feline animal
                Makes meow sound
                Pet at home
                Makes this sound "Purr"
                Has whiskers
                What animal is Garfield?

                Format like above.
                
                Exclude the quotation marks. I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(i + count_cues[0].count, word_retrieval_task_id, cues[i], "message");
                }
            })
        }
        return res.status(200).json({
            "status": "SUCCESS",
            "message": `${type} cues generated successfully.`,
            "num_cues": num_cues
        });
    } catch (error: any) {
        if (num_cues == 0) {
            return res.status(400).json({
                "status": "FAILURE",
                "message": "Number of cues not provided."
            });
        }
        return res.status(400).json({
            "status": "FAILURE",
            "message": "Word Retrieval Task ID not found."
        });
    }
}