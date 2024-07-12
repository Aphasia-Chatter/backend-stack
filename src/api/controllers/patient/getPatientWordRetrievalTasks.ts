import { Request, Response } from 'express';
import { TaskCompletionStatus } from '../enums/TaskCompletionStatus';

import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import fetchAllPatientWordRetrievalTask from 'src/api/repositories/fetchAllPatientWordRetrievalTask';
import selectPatientWordRetrievalTasksWithFilters from 'src/api/repositories/selectPatientWordRetrievalTasksWithFilters';

import selectStaffByPatientId from 'src/api/repositories/selectStaffByPatientID';
import fetchAllPatientWordRetrievalTaskSessionsByTaskIDs from 'src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs'
import { configLoader } from 'tsconfig-paths/lib/config-loader';

// interface GetWordRetrievalTaskFilters {
//     name: string,
//     creator_name: string,
//     completion_status: TaskCompletionStatus,
//     max_selection: number,
//     selection_offset: number,
//     creator_is_patient_staff: boolean
// }

export default async function getPatientWordRetrievalTasks(req: Request, res: Response) {
    const { username, sessionToken } = req.query;
    
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
        // const jsonBody = req.body as Partial<GetWordRetrievalTaskFilters>;
        // const selectionResult = await selectPatientWordRetrievalTasksWithFilters(
        //     relatedPatient.id,
        //     jsonBody.name,
        //     jsonBody.creator_name,
        //     jsonBody.completion_status,
        //     jsonBody.creator_is_patient_staff,
        //     jsonBody.max_selection,
        //     jsonBody.selection_offset
        // );

        // 1. Get the staff who enrolled the patient in the system
        const result = await selectStaffByPatientId(relatedPatient.id)
        if (result.length <= 0) {
            return res.status(400).json({
                'status': 'BAD_USERNAME',
                'message': 'User does not exist!',
                'data': {}
            }); 
        }
    
        const relatedStaff = result[0]
    
        // 2. Get all word retrieval tasks created by the staff related to the patient
        const result2 = await fetchAllPatientWordRetrievalTask(relatedStaff.staff.id);
        if (result2.length <= 0) {
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No word retrieval tasks found!',
                'data': {}
            });
        }

        // Fetch task sessions by task IDs
        const taskIDs = result2.map(task => task.word_retrieval_task.taskID);

        // Get the task IDs
        const taskSessions = await fetchAllPatientWordRetrievalTaskSessionsByTaskIDs(taskIDs);

        // Create a map for quick lookup
        const taskSessionMap = new Map(taskSessions.map(session => [session.taskID, { startedAt: session.startedAt, completedAt: session.completedAt }]));

        // 4. Add status if taskID does not exist in taskSessionIDs
        const tasksWithStatus = result2.map(task => {
            const taskID = task.word_retrieval_task.taskID;
            const taskSession = taskSessionMap.get(taskID);

            if (taskSession) {
                if (taskSession.completedAt) {
                    return { ...task, status: "Completed" };
                } else if (taskSession.startedAt) {
                    return { ...task, status: "In Progress" };
                }
            } else {
                return { ...task, status: "Not Started" };
            }
            return task;
        });

        return res.status(200).json({
            status: "SUCCESS",
            message: "Word retrieval tasks successfully retrieved",
            data: {
                tasks: tasksWithStatus
            }
        });

    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    } 
}