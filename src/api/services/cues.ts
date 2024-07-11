import invoke from '../utils/llm/invoke';
import { db } from 'src/db';
import { count, eq } from 'drizzle-orm';
import { wordRetrievalTask, wordRetrievalTaskHint } from 'src/schema';
import insertWordRetrevialTaskHint from '../repositories/insertWordRetrievalTaskHint';
import { Request, Response } from 'express';


export async function generateCues(req: Request, res: Response): Promise<Response> {
    const request = req.body;
    var word_retrieval_task_id: any = null;
    var num_cues: number = 0;
    var hierarchy: number = 0;
    try {
        word_retrieval_task_id = request["word_retrieval_task_id"];
        num_cues = request["num_cues"];
        hierarchy = request["hierarchy_num"];
        // Fetch word from database
        const result = await db.select().from(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, word_retrieval_task_id));
        // Select count of cues from database
        const count_cues = await db.select({ count: count() }).from(wordRetrievalTaskHint);
        const cues: any[] = [];
        if (hierarchy === 1) {
            await invoke(`
                Generate ${num_cues} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which is semantic in nature.

                Below are several examples of cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                You use this to buy things.
                Can find inside wallet
                You deposit this in the bank.

                Format like above. Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(
                        i + count_cues[0].count, 
                        word_retrieval_task_id, 
                        cues[i], 
                        hierarchy,
                        "message"
                    );
                }
            })
        } else if (hierarchy === 2) {
            await invoke(`
                Generate ${num_cues} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which is rhyming in nature.

                Below are several examples of cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                It sounds like 'bunny'

                Format like above. Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(
                        i + count_cues[0].count, 
                        word_retrieval_task_id, 
                        cues[i], 
                        hierarchy,
                        "message"
                    );
                }
            })
        }
        else if (hierarchy === 3 || hierarchy === 4) {
            // 3 and 4 has the same cues as hierarchy 4 basically gives out the answer
            await invoke(`
                Generate ${num_cues} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which allows the patient to fill in the blanks.

                Below are several examples of phonetic cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                M _ _ _ _ (Fill in the blanks)
                M _ n _ _ (Fill in the blanks)
                M o _ _ y (Fill in the blanks)

                Format like above. [Note: _ represents the missing character.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(
                        i + count_cues[0].count, 
                        word_retrieval_task_id, 
                        cues[i], 
                        hierarchy,
                        "message"
                    );
                }
            })
        }
        else if (hierarchy === 5) {
            await invoke(`
                Generate ${num_cues} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which allows the patient to see the context of the word in a sentence.

                Below are several examples of phonetic cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                I need some ____ .(fill in the blank)
                Pay with ____ .(fill in the blank)
                She saved ____ for school fees. (fill in the blank)

                Format like above. [Note: ___ represents the missing word.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(
                        i + count_cues[0].count, 
                        word_retrieval_task_id, 
                        cues[i], 
                        hierarchy,
                        "message"
                    );
                }
            })
        }
        else if (hierarchy === 6) {
            await invoke(`
                Generate ${num_cues} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which provides the first sound/syllable of the target word.

                Below are several examples of phonetic cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                It starts with 'mo...'
                It starts with 'mon...'
                The word starts with 'mon...'

                Pay with ____ .(fill in the blank)
                She saved ____ for school fees. (fill in the blank)

                Format like above. [Note: ___ represents the missing word.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `).then((response) => {
                const respose_cues = response ? response.split("\n") : [];
                console.log(respose_cues);
                for (let i = 0; i < respose_cues.length; i++) {
                    cues.push(respose_cues[i]); 
                    console.log(i + count_cues[0].count - 1);
                    insertWordRetrevialTaskHint(
                        i + count_cues[0].count, 
                        word_retrieval_task_id, 
                        cues[i], 
                        hierarchy,
                        "message"
                    );
                }
            })
        }      
        else {
            return res.status(400).json({
                "status": "FAILURE",
                "message": "Invalid hierarchy number."
            });
        }
        return res.status(200).json({
            "status": "SUCCESS",
            "message": `Type ${hierarchy} hierarchy cues generated successfully.`,
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