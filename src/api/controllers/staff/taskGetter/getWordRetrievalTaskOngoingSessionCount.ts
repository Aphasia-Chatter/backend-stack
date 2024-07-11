import { Request, Response } from 'express';

import validateStaffRequest from 'src/api/utils/validateStaffRequest';
import fetchAllPatientWordRetrievalTaskSessionsByTaskID from 'src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskID' 

export default async function getWordRetrievalTasksOngoingSessionCount(req: Request,res: Response) {
    const username = req.query.username as string;
    const validationResponse = await validateStaffRequest(req, username)

    if (!validationResponse.isValid) {
        return res.status(400).json({
            'status': validationResponse.status,
            'message': validationResponse.message,
            'data': {}
        });
    }

    try {
        const taskId = req.query.taskId as string;

        const patientWordRetrievalTaskSessions = await fetchAllPatientWordRetrievalTaskSessionsByTaskID(taskId);

        if (patientWordRetrievalTaskSessions) {
            // Filter the list to get only those with startedAt and without completedAt
            const filteredSessions = patientWordRetrievalTaskSessions.filter(session =>
                session.startedAt && session.completedAt === null
            );

            // Return the count of filtered sessions
            const wordRetrievalTaskOngoingSessionCount = filteredSessions.length;

            // A list of word retrieval task ongoing session count found
            return res.status(200).json({
                'status': 'SUCCESS',
                'message': 'Successfully retrieved word retrieval task ongoing session count!',
                'data': {
                    wordRetrievalTaskOngoingSessionCount: wordRetrievalTaskOngoingSessionCount
                }
            });
        }
        else { 
            // No word retrieval task ongoing session count found
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No word retrieval task ongoing session count found.',
                'data': {}
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

