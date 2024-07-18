import invoke from '../utils/llm/invoke';
import { db } from 'src/db';
import { count, eq } from 'drizzle-orm';
import { wordRetrievalTask, wordRetrievalTaskHint } from 'src/schema';
import insertWordRetrevialTaskHint from '../repositories/insertWordRetrievalTaskHint';

export async function generateCuesForTask(
    taskID: string,
    numCuesToGenerate: number,
    hierarchy: number
): Promise<string[]> {
    try {
        // Fetch word from database
        const result = await db.select().from(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, taskID));
        // Select count of cues from database
        const count_cues = await db.select({ count: count() }).from(wordRetrievalTaskHint);
        const cues: string[] = [];
        if (hierarchy === 1) {
            const response = await invoke(`
                Generate ${numCuesToGenerate} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                Determine first if the word is a noun, verb, adjective, or adverb. Generate the cue(s) accordingly.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which is semantic in nature.

                Below are several examples of cues for the target word "Money" (noun), with a hierarchy of ${hierarchy}:
                
                You use this to buy things.
                Can find inside wallet
                You deposit this in the bank.

                Below are several examples of cues for the target word "Cooking" (verb), with a hierarchy of ${hierarchy}:

                You do this to make food.
                You need a stove to do this.
                You need a pan to do this.

                Format like above. Keep it short. The above is an example for a noun, if it is a verb, adjective, or adverb, please adjust accordingly.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `)
            const respose_cues = response ? response.split("\n") : [];
            console.log(respose_cues);
            for (let i = 0; i < respose_cues.length; i++) {
                cues.push(respose_cues[i]); 
                console.log(i + count_cues[0].count);
                insertWordRetrevialTaskHint(
                    i + count_cues[0].count, 
                    taskID, 
                    cues[i], 
                    hierarchy,
                    "message"
                );
            }
        } else if (hierarchy === 2) {
            const response = await invoke(`
                Generate ${numCuesToGenerate} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                Determine first if the word is a noun, verb, adjective, or adverb. Generate the cue(s) accordingly.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which is rhyming in nature.

                Below are several examples of cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                It sounds like 'bunny'

                Format like above. Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `)
            const respose_cues = response ? response.split("\n") : [];
            console.log(respose_cues);
            for (let i = 0; i < respose_cues.length; i++) {
                cues.push(respose_cues[i]); 
                console.log(i + count_cues[0].count);
                insertWordRetrevialTaskHint(
                    i + count_cues[0].count, 
                    taskID, 
                    cues[i], 
                    hierarchy,
                    "message"
                );
            }
        }
        else if (hierarchy === 3 || hierarchy === 4) {
            // 3 and 4 has the same cues as hierarchy 4 basically gives out the answer
            const response = await invoke(`
                Generate ${numCuesToGenerate} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                Determine first if the word is a noun, verb, adjective, or adverb. Generate the cue(s) accordingly.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which allows the patient to fill in the blanks.

                Below are several examples of phonetic cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                M _ _ _ _ (Fill in the blanks)
                M _ n _ _ (Fill in the blanks)
                M o _ _ y (Fill in the blanks)

                Format like above. [Note: _ represents the missing character.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `)

            const respose_cues = response ? response.split("\n") : [];
            console.log(respose_cues);
            for (let i = 0; i < respose_cues.length; i++) {
                cues.push(respose_cues[i]); 
                console.log(i + count_cues[0].count);
                insertWordRetrevialTaskHint(
                    i + count_cues[0].count, 
                    taskID, 
                    cues[i], 
                    hierarchy,
                    "message"
                );
            }
        }
        else if (hierarchy === 5) {
            const response = await invoke(`
                Generate ${numCuesToGenerate} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                Determine first if the word is a noun, verb, adjective, or adverb. Generate the cue(s) accordingly.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which allows the patient to see the context of the word in a sentence.

                Below are several examples of cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                I need some ____ .(fill in the blank)
                Pay with ____ .(fill in the blank)
                She saved ____ for school fees. (fill in the blank)

                Below are some cues for the target word "Cooking" with a hierarchy of ${hierarchy}:

                I love ____.(fill in the blank)
                She is ____ in the kitchen.(fill in the blank)
                I am ____ the pizza.(fill in the blank)

                Format like above. [Note: ___ represents the missing word.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `)

            const respose_cues = response ? response.split("\n") : [];
            console.log(respose_cues);
            for (let i = 0; i < respose_cues.length; i++) {
                cues.push(respose_cues[i]); 
                console.log(i + count_cues[0].count);
                insertWordRetrevialTaskHint(
                    i + count_cues[0].count, 
                    taskID, 
                    cues[i], 
                    hierarchy,
                    "message"
                );
            }
        }
        else if (hierarchy === 6) {
            const response = await invoke(`
                Generate ${numCuesToGenerate} cues for getting aphasia patient to recall the target word: ${result[0]['answer']}.

                Determine first if the word is a noun, verb, adjective, or adverb. Generate the cue(s) accordingly.

                The cue you are to generate is of ${hierarchy} in the cueing hierarchy scale, which provides the first sound/syllable of the target word.

                Below are several examples of phonetic cues for the target word "Money" with a hierarchy of ${hierarchy}:
                
                It starts with 'mo...'
                It starts with 'mon...'
                The word starts with 'mon...'

                Pay with ____ .(fill in the blank)
                She saved ____ for school fees. (fill in the blank)

                Format like above. [Note: ___ represents the missing word.] Keep it short.
                
                I want to read the output line by line, so please do not include anything before or after the cues.
            `)

            const respose_cues = response ? response.split("\n") : [];
            console.log(respose_cues);
            for (let i = 0; i < respose_cues.length; i++) {
                cues.push(respose_cues[i]); 
                console.log(i + count_cues[0].count);
                insertWordRetrevialTaskHint(
                    i + count_cues[0].count, 
                    taskID, 
                    cues[i], 
                    hierarchy,
                    "message"
                );
            }
        } else {
            throw new Error(`Invalid hierarchy: ${hierarchy}`);
        }

        return cues;
    } catch (error: any) {
        throw error;
    }
}