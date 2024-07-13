import { Request, Response } from 'express';

import * as path from 'path';
import * as fs from 'fs';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectMessageByID from 'src/api/repositories/selectMessageByID';
import selectSessionMessagesBySessionID from 'src/api/repositories/selectSessionMessagesBySessionID';
import selectTaskSessionByID from 'src/api/repositories/selectTaskSessionByID';
import insertLog from 'src/api/repositories/insertLog';

interface GetMessageAudioRequest {
    username: string;
    sessionToken: string;
    messageID: string;
}

export default async function getMessageAudio(req: Request, res: Response) {

    const jsonReq = req.body as Partial<GetMessageAudioRequest>;
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

    if (!jsonReq.messageID) {
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
        const messageORM = await selectMessageByID(jsonReq.messageID)
        if (messageORM.length === 0) {
            return res.status(404).json({
                'status': 'FAILED',
                'message': 'Message not found.',
                'data': {}
            })
        }

        const message = messageORM[0]
        const sessionORM = await selectTaskSessionByID(message.sessionID)
        if (sessionORM.length === 0) {
            return res.status(404).json({
                'status': 'FAILED',
                'message': 'Session not found.',
                'data': {}
            })
        }

        // Not patient's session
        if (sessionORM[0].patientID !== relatedUser.id) {
            return res.status(401).json({
                'status': 'NOT_PATIENT_SESSION',
                'message': 'No access to view voice recordings',
                'data': {}
            })
        }

        const filePath = message.audioFilePath
        if (!filePath) {
            return res.status(404).json({
                'status': 'FAILED',
                'message': 'Message audio not found.',
                'data': {}
            })
        }

        const absolutePath = path.resolve(filePath);
        await fs.promises.access(absolutePath, fs.constants.F_OK);
        const data = await fs.promises.readFile(absolutePath);
        return res.status(200).json({
            data: data.toString('base64')
        });

    } catch (error) {
        console.error(error)
        await insertLog(`Error while fetching message audio :: ${error}`, 'ERROR')
        return res.status(500).json({
            'status': 'FAILED',
            'message': 'Error while fetching message audio.',
            'data': {}
        })
    }
}