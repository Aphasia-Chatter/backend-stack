import { Request, Response } from 'express';

import fs from 'fs';
import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import selectWordRetrievalTaskSessionByPatientIDAndTaskID from 'src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskID';
import insertWordRetrievalTaskSession from 'src/api/repositories/insertWordRetrievalTaskSession';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectTaskSessionByID from 'src/api/repositories/selectTaskSessionByID';
import selectSessionMessagesBySessionID from 'src/api/repositories/selectSessionMessagesBySessionID';
import doChatCompletion from 'src/api/services/doChatCompletion';
import { db } from 'src/db';
import { wordRetrievalSession, wordRetrievalSessionMessage } from 'src/schema';
import insertLog from 'src/api/repositories/insertLog';
import OpenAI, { toFile } from 'openai';
import invoke from 'src/api/utils/llm/invoke';
import { verifyAnswer } from 'src/api/services/verify';
import selectHintByTaskID from 'src/api/repositories/selectHintByTaskID';
import { generateCuesForTask } from 'src/api/services/generateCuesForTask';
import updateTaskSessionSuccessStatus from 'src/api/repositories/updateTaskSessionSuccessStatus';
import updateIncrementTaskHintUsedCount from 'src/api/repositories/updateIncrementTaskHintUsedCount';
import { eq } from 'drizzle-orm';

interface ChatOnSessionRequest {
    username: string;
    sessionToken: string;
    taskSessionID: string;
    audioFilePath: string;
    audioFileData: string;
}

/**
 * TODO: Refactor, repeating with chatOnSession.ts
 */
export default async function chatAudioOnSession(
    req: Request,
    res: Response
) {
    // TODO: @wqyeo refactor, see /chat-session-audio on patientRoutes.ts
    const jsonReq = req.body as Partial<ChatOnSessionRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.taskSessionID) {
        return res.status(400).json({
            'status': 'MISSING_TASK_ID',
            'message': 'task id is missing in the request body field.',
            'data': {}
        });
    }

    const validationResult = await validatePatientRequest(req, jsonReq.username)
    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        })
    }
    
    if (!jsonReq.audioFilePath) {
        return res.status(400).json({
            'status': 'MISSING AUDIO FILE',
            'message': 'Missing audio file. (image: null)',
            'data': {}
        });
    }

    const filePath = jsonReq.audioFilePath;
    const audioFileBase64 = jsonReq.audioFileData;
    if (!audioFileBase64) {
        return res.status(400).json({ error: "'audioFile' key is missing or undefined in the request body." });
    }
    // TODO: Verify that its an actual audio file.

    const relatedUser = validationResult.patient!
    try {
        // Get tasks from database.
        const ormTaskSessions = await selectTaskSessionByID(jsonReq.taskSessionID);
        if (!ormTaskSessions || ormTaskSessions.length <= 0) {
            return res.status(404).json({
                'status': 'NOT_FOUND',
                'message': 'task session not found!',
                'data': {}
            })
        }

        // Check if belongs to user
        const taskSession = ormTaskSessions[0];
        if (taskSession.patientID !== relatedUser.id) {
            await insertLog(
                `Patient (${relatedUser.id}) attempted to access a session he does not own! (${taskSession.id} belongs to ${taskSession.patientID})`,
                'WARNING'
            )
            return res.status(403).json({
                'status': 'FORBIDDEN',
                'message': 'task session not found!',
                'data': {}
            })
        }

        const task = (await selectWordRetrievalTaskByTaskID(taskSession.taskID))[0];
        /*if (task.word_retrieval_task?.inputRestriction !== 'VOICE_ONLY') {
            return res.status(400).json({
                'status': 'VOICE_ONLY',
                'message': 'Voice only task.',
                'data': {}
            })
        }*/
        
        // Transcribe audio, put to message chain
        const audioFileBuffer = Buffer.from(audioFileBase64, 'base64');
        const openai = new OpenAI({
            organization: `${process.env.OPENAI_ORGANIZATION}`,
            project: `${process.env.OPENAI_PROJECT}`
        })
        const audioFile = await toFile(audioFileBuffer, "voice.m4a");
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "en"
        });

        console.log(transcription.text);

        const isCorrectAnswer = await verifyAnswer(task.task?.id!, transcription.text);
        let completed = isCorrectAnswer; // Completed if the answer is correct as well
        let botResponse = ""
        if (isCorrectAnswer) {
            botResponse = (await invoke(`
                The target answer is ${task.word_retrieval_task?.answer}, which could 
                refer to an object (noun) or an action (verb). Write a congratulatory 
                message confirming the correct answer. Then, describe the target answer 
                briefly based on its type: if it’s an object, describe what it is; if 
                it’s an action, describe what it involves.
            `))!;
        } else {
            // Fetch hints from task
            const currentHintsUsed = taskSession.hintsUsedCount;

            // Auto-failed after 4th hint
            if (currentHintsUsed > 5) {
                completed = true;
                botResponse = (await invoke(`
                    The target answer is ${task.word_retrieval_task?.answer}, which could 
                    refer to an object (noun) or an action (verb). Write a short one sentence
                    description of the target answer, if it’s an object, describe what it is; 
                    if it’s an action, describe what it involves.
                `))!;
            } else {
                // Find next hint from database
                const nextHintORM = await selectHintByTaskID(taskSession.taskID, currentHintsUsed);

                if (nextHintORM.length <= 0) {
                    // No hints set, generate one.
                    // TODO: Next tri or something, generate hints based on messaging history and current input
                    // TODO: Select hierarcy
                    if (currentHintsUsed <= 1) {
                        const cues = await generateCuesForTask(taskSession.taskID, 1, 1)
                        botResponse = cues[0]
                    }
                    if (currentHintsUsed == 2) {
                        const cues = await generateCuesForTask(taskSession.taskID, 1, 2)
                        botResponse = cues[0]
                    }
                    if (currentHintsUsed == 3) {
                        const cues = await generateCuesForTask(taskSession.taskID, 1, 3)
                        botResponse = cues[0]
                    }
                    if (currentHintsUsed == 4) {
                        const cues = await generateCuesForTask(taskSession.taskID, 1, 5)
                        botResponse = cues[0]
                    }
                    if (currentHintsUsed == 5) {
                        const cues = await generateCuesForTask(taskSession.taskID, 1, 6)
                        botResponse = cues[0]
                    }
                    

                } else {
                    botResponse = nextHintORM[0].content
                }
            }
        }

        // Insert both messages into database
        let insertedUserMessageOrm: { id: string }[] = [];
        let insertedBotMessageORM: { id: string }[] = [];
        await db.transaction(async (tx) => {
            insertedUserMessageOrm = await tx.insert(wordRetrievalSessionMessage).values({
                sessionID: taskSession.id,
                author: 'user',
                content: transcription.text,
                audioFilePath: filePath
            }).returning({ id: wordRetrievalSessionMessage.id })

            insertedBotMessageORM = await tx.insert(wordRetrievalSessionMessage).values({
                sessionID: taskSession.id,
                author: 'bot',
                content: botResponse
            }).returning({ id: wordRetrievalSessionMessage.id })

            if (completed) {
                // Flag completed in database
                await tx.update(wordRetrievalSession).set(
                    {isSuccessful: isCorrectAnswer, completedAt: new Date()},
                ).where(eq(wordRetrievalSession.id, taskSession.id))
            } 

            if (!completed && !isCorrectAnswer) {
                // Not completed; Increment hints used
                await tx.update(wordRetrievalSession).set(
                    {hintsUsedCount: taskSession.hintsUsedCount + 1}
                ).where(eq(wordRetrievalSession.id, taskSession.id))
            }
        });

        if (insertedUserMessageOrm.length <= 0 || insertedBotMessageORM.length <= 0) {
            console.error(`Message not inserted!
                \r\nUser Message Object reference :: ${insertedUserMessageOrm}
                \r\nBot Message Object reference :: ${insertedBotMessageORM}
                \r\nBot message reference :: ${botResponse}
            `);

            return res.status(500).json({
                'status': 'SERVER_ERROR',
                'message': 'Server encountered an error! Contact admin if persists!',
                'data': {}
            });
        }

        console.log("completed", completed, "isCorrectAnswer", isCorrectAnswer);

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'message sent successfully!',
            'data': {
                'botMessageID': insertedBotMessageORM[0].id!,
                'userMessageID': insertedUserMessageOrm[0].id!,
                'message': botResponse,
                'transcription': transcription.text,
                'completed': completed,
                'isCorrectAnswer': isCorrectAnswer
            }
        });

    } catch (err) {
        console.log("What the fuck is this error", err)
        await insertLog(
            `Failed to chat on session :: ${err}`,
            'ERROR'
        )
        if (filePath) {
            deleteUploadedFile(filePath);
        }
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}

function deleteUploadedFile(filePath: string) {
    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("Error deleting file (chatAudioOnSession) :: ", error);
        insertLog("Error deleting file (chatAudioOnSession) :: " + error, "CRITICAL").then(() => {});
    }
}
