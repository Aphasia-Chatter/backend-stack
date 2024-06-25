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
    const patientUsername = req.body['username'] as string    

    const validTokenResult = await validatePatientRequest(req, patientUsername);

    if (!validTokenResult.isValid) {
        return res.status(400).json({
            status: validTokenResult.status,
            message: validTokenResult.message
        });
    }

    const patientObject = validTokenResult.patient!
    const jsonBody = req.body as Partial<GetWordRetrievalTaskFilters>;

    const selectionResult = await selectPatientWordRetrievalTasksWithFilters(
        patientObject.id,
        jsonBody.name,
        jsonBody.creator_name,
        jsonBody.completion_status,
        jsonBody.creator_is_patient_staff,
        jsonBody.max_selection,
        jsonBody.selection_offset
    );

    return res.status(200).json({
        status: "SUCCESS",
        message: "Word retrieval tasks successfully retrieved",
        data: selectionResult
    });    
}