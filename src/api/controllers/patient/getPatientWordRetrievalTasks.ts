import { Request, Response } from 'express';
import { TaskCompletionStatus } from '../enums/TaskCompletionStatus';

import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectPatientWordRetrievalTasksWithFilters from 'src/api/repositories/selectPatientWordRetrievalTasksWithFilters';


interface GetWordRetrievalTaskFilters {
    name: string,
    creator_name: string,
    completion_status: TaskCompletionStatus,
    max_selection: number,
    selection_offset: number,
    creator_is_patient_staff: boolean
}

export default async function getPatientWordRetrievalTasks(req: Request, res: Response) {
    const { username, sessionToken } = req.query;
    console.log("username: ", username);
    console.log("username2: ", sessionToken);
    
    if (!username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.',
            'data': {}
        });
    }

    const validationResult = await validatePatientRequest(req, username.toString())
    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        })
    }

    const relatedPatient = validationResult.patient!

    try {
        const jsonBody = req.body as Partial<GetWordRetrievalTaskFilters>;
        
        const selectionResult = await selectPatientWordRetrievalTasksWithFilters(
            relatedPatient.id,
            jsonBody.name,
            jsonBody.creator_name,
            jsonBody.completion_status,
            jsonBody.creator_is_patient_staff,
            jsonBody.max_selection,
            jsonBody.selection_offset
        );
    
        if (selectionResult.length > 0) {
            console.log(selectionResult)
            return res.status(200).json({
                status: "SUCCESS",
                message: "Word retrieval tasks successfully retrieved",
                data: {
                    tasks: selectionResult
                }
            });
    
        } else {
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No word retrieval tasks found!',
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