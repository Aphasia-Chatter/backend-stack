import { Request, Response } from 'express';

import selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID from 'src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID';
import updateWordRetrievalTaskSessionByID from 'src/api/repositories/updateWordRetrievalTaskSessionByID'
import validatePatientRequest from 'src/api/utils/validatePatientRequest';

interface SaveWordRetrievalTaskSessionRequest {
    username: string;
    sessionToken: string;
    taskSessionID: string;
    hintsUsedCount: number;
    completedAt: string;
}

export default async function saveWordRetrievalTaskSession(req: Request, res: Response) {
    const jsonReq = req.body as Partial<SaveWordRetrievalTaskSessionRequest>;

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
            'status': 'MISSING_TASK_SESSION_ID',
            'message': 'task session id is missing in the request body field.',
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
        // Check if task session exist for the particular patient (meaning they have already started task)
        const result1 = await selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID(relatedUser.id, jsonReq.taskSessionID)
        if (result1.length == 0) {
            return res.status(400).json({
                'status': 'BAD_TASK_SESSION',
                'message': 'Task session does not exist!',
                'data': {}
            }); 
        }

        // Check that it is not completed (meaning they have already completed the task)
        const relatedTaskSession = result1[0]
        if (relatedTaskSession.completedAt != null) {
            return res.status(201).json({
                status: 'SAVE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS',
                message: `The new task session for task has been created`,
            });

        } else {
            // Update the word retrieval task session of that patient
            await updateWordRetrievalTaskSessionByID(relatedUser.id, jsonReq.taskSessionID, jsonReq.hintsUsedCount!, new Date(jsonReq.completedAt!))
            return res.status(201).json({
                status: 'CREATE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS',
                message: `The new task session for task has been created`,
            });
        }
    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}