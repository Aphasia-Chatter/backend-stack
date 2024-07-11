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
import { wordRetrievalSessionMessage } from 'src/schema';
import insertLog from 'src/api/repositories/insertLog';
import OpenAI, { toFile } from 'openai';

interface ChatOnSessionRequest {
    username: string;
    sessionToken: string;
    sessionID: string;
}

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

    if (!jsonReq.sessionID) {
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

    if (!req.file) {
        return res.status(400).json({
            'status': 'MISSING_IMAGE',
            'message': 'Missing image file. (image: null)',
            'data': {}
        });
    }

    const filePath = req.file.path;
    const audioFileBase64 = req.body.audioFile;
    if (!audioFileBase64) {
        return res.status(400).json({ error: "'audioFile' key is missing or undefined in the request body." });
    }
    // TODO: Verify that its an actual audio file.

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
        if (task.word_retrieval_task?.inputRestriction == 'VOICE_ONLY') {
            return res.status(400).json({
                'status': 'VOICE_ONLY',
                'message': 'Voice only task.',
                'data': {}
            })
        }
        
        // Generate message chain based on history
        const messageChain = []
        messageChain.push({
            'role': 'system',
            'content': 
                `
                The user is seeing an image of a ${task.word_retrieval_task?.answer}, and the user is trying to guess the image's object name. 
                You are to provide clues and hints to the user based on the input. You are to inform if the user has guessed correctly.
                `
        })

        // Populate message chain with history
        const messageHistory = await selectSessionMessagesBySessionID(jsonReq.sessionID);
        for (let i = messageHistory.length - 1; i >= 0; i--) {
            const current = messageHistory[i]
            const role = current.author === 'bot' ? 'assistant' : current.author;
            messageChain.push({
                'role': role,
                'content': current.content
            })
        }

        // Transcribe audio, put to message chain
        const audioFileBuffer = Buffer.from(audioFileBase64, 'base64');
        const openai = new OpenAI({
            organization: `${process.env.OPENAI_ORGANIZATION}`,
            project: `${process.env.OPENAI_PROJECT}`
        })
        const audioFile = await toFile(audioFileBuffer, "voice.m4a");
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1"
        });
        messageChain.push({
            'role': 'user',
            'content': transcription.text
        })

        // Perform chat completion with transcribed text
        const completionResponse = await doChatCompletion(messageChain);
        const completionMessage = completionResponse.choices[0].message.content!
        if (!completionMessage) {
            console.error(`completion message is empty! Completion Object reference :: ${completionResponse}`);
            return res.status(500).json({
                'status': 'SERVER_ERROR',
                'message': 'Server encountered an error! Contact admin if persists!',
                'data': {}
            });
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
                content: completionMessage
            }).returning({ id: wordRetrievalSessionMessage.id })
        });

        if (insertedUserMessageOrm.length <= 0 || insertedBotMessageORM.length <= 0) {
            console.error(`Message not inserted!
                \r\nUser Message Object reference :: ${insertedUserMessageOrm}
                \r\nBot Message Object reference :: ${insertedBotMessageORM}
                \r\nCompletion message reference :: ${completionMessage}
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
                'message': completionMessage
            }
        });

    } catch (err) {
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
