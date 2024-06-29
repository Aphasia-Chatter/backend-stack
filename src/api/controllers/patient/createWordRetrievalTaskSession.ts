import { Request, Response } from 'express';

import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import selectWordRetrievalTaskSessionByPatientIDAndTaskID from 'src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskID';
import insertWordRetrievalTaskSession from 'src/api/repositories/insertWordRetrievalTaskSession';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';

interface CreateWordRetrievalTaskSessionRequest {
    username: string;
    sessionToken: string;
    taskID: string;
}

export default async function createWordRetrievalTaskSession(req: Request, res: Response) {
    const jsonReq = req.body as Partial<CreateWordRetrievalTaskSessionRequest>;
    console.log(jsonReq.username)
    console.log(jsonReq.sessionToken)
    console.log(jsonReq.taskID)

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

    if (!jsonReq.taskID) {
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
        // Check if task exist in the first place
        const result1 = await selectWordRetrievalTaskByTaskID(jsonReq.taskID)
        if (result1.length == 0) {
            return res.status(400).json({
                'status': 'BAD_TASK',
                'message': 'Task does not exist!',
                'data': {}
            }); 
        }

        // Check if task session does not exist for the particular patient (meaning they have not started task)
        const result2 = await selectWordRetrievalTaskSessionByPatientIDAndTaskID(relatedUser.id, jsonReq.taskID)
        if (result2.length > 0) {
            return res.status(400).json({
                'status': 'BAD_TASK_SESSION',
                'message': 'Task session already exist!',
                'data': {}
            }); 
        }

        // Create a word retrieval task session for that patient
        await insertWordRetrievalTaskSession(relatedUser.id, jsonReq.taskID)
        return res.status(201).json({
            status: 'CREATE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS',
            message: `The new task session for task ${result1[0].task?.name} has been created`,
        });

    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}