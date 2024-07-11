import { Request, Response } from 'express';

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

interface GetChatSessionHistoryRequest {
    username: string;
    sessionToken: string;
    sessionID: string;
}

export default async function getChatSessionHistory(req: Request, res: Response) {
    const jsonReq = req.body as Partial<GetChatSessionHistoryRequest>;

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
        // Populate message chain with history
        const messageHistory = await selectSessionMessagesBySessionID(jsonReq.sessionID);
        const historyChain = []
        for (let i = 0; i < messageHistory.length; i++) {
            const current = messageHistory[i]
            historyChain.push({
                'id': current.id,
                'author': current.author,
                'content': current.content,
                'timestamp': current.sentAt,
                'hasAudio': current.audioFilePath !== null
            })
        }

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'message sent successfully!',
            'data': {
                'messages': historyChain
            }
        });

    } catch (err) {
        await insertLog(
            `Failed to get chat session history :: ${err}`,
            'ERROR'
        )
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}