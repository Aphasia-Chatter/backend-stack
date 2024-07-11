import { Request, Response } from 'express';

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
import { verifyAnswer } from 'src/api/services/verify';
import invoke from 'src/api/utils/llm/invoke';
import selectHintByTaskID from 'src/api/repositories/selectHintByTaskID';
import { generateCuesForTask } from 'src/api/services/generateCuesForTask';
import updateTaskSessionSuccessStatus from 'src/api/repositories/updateTaskSessionSuccessStatus';
import updateIncrementTaskHintUsedCount from 'src/api/repositories/updateIncrementTaskHintUsedCount';
import { eq } from 'drizzle-orm';

interface ChatOnSessionRequest {
    username: string;
    sessionToken: string;
    sessionID: string;
    content: string;
}

/**
 * TODO: Refactor, repeating with chatAudioOnSession.ts
 */
export default async function chatOnSession(req: Request, res: Response) {
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

    if (!jsonReq.sessionID) {
        return res.status(400).json({
            'status': 'MISSING_TASK_ID',
            'message': 'task id is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.content || jsonReq.content.trim().length === 0) {
        return res.status(400).json({
            'status': 'MISSING_CONTENT',
            'message': 'content is missing in the request body field.',
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

    const relatedUser = validationResult.patient!

    try {
        // Get tasks from database.
        const ormTaskSessions = await selectTaskSessionByID(jsonReq.sessionID);
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
        // Prevent if this task is audio only
        if (task.word_retrieval_task?.inputRestriction == 'VOICE_ONLY') {
            return res.status(400).json({
                'status': 'VOICE_ONLY',
                'message': 'Voice only task.',
                'data': {}
            })
        }

        const isCorrectAnswer = await verifyAnswer(task.task?.id!, jsonReq.content);

        let completed = isCorrectAnswer; // Is completed if correct answer as well.
        let botResponse = ""
        if (isCorrectAnswer) {
            botResponse = (await invoke(`
                The target answer is ${task.word_retrieval_task?.answer}. Write a congratulatory message 
                telling the user that he/she got the right answer, and give a short one sentence
                description of the target answer.
            `))!;
        } else {
            // Fetch hints from task
            const currentHintsUsed = taskSession.hintsUsedCount;

            // Auto-failed after 4th hint
            if (currentHintsUsed >= 4) {
                completed = true;
                botResponse = (await invoke(`
                    The target answer is ${task.word_retrieval_task?.answer}. Write a short one sentence
                    description of the target answer.
                `))!;
            } else {
                // Find next hint from database
                const nextHintORM = await selectHintByTaskID(taskSession.taskID, currentHintsUsed);

                if (nextHintORM.length <= 0) {
                    // No hints set, generate one.
                    // TODO: Next tri or something, generate hints based on messaging history and current input
                    // TODO: Select hierarcy
                    const cues = await generateCuesForTask(taskSession.taskID, 1, 1)
                    botResponse = cues[0]
                } else {
                    botResponse = nextHintORM[0].content
                }
            }
        }

        // Insert both user and bot message into database
        let insertedUserMessageOrm: { id: string }[] = [];
        let insertedBotMessageORM: { id: string }[] = [];
        await db.transaction(async (tx) => {
            insertedUserMessageOrm = await tx.insert(wordRetrievalSessionMessage).values({
                sessionID: taskSession.id,
                author: 'user',
                content: jsonReq.content!
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

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'message sent successfully!',
            'data': {
                'botMessageID': insertedBotMessageORM[0].id!,
                'userMessageID': insertedUserMessageOrm[0].id!,
                'message': botResponse,
                'completed': completed,
                'isCorrectAnswer': isCorrectAnswer
            }
        });

    } catch (err) {
        await insertLog(
            `Failed to chat on session :: ${err}`,
            'ERROR'
        )
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}