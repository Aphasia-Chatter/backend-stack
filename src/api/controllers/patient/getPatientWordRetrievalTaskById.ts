import { Request, Response } from 'express';

import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import fetchAllPatientWordRetrievalTaskSessionsByTaskIDs from 'src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs';

export default async function getPatientWordRetrievalTaskSession(req: Request, res: Response) {
    let taskID: string;
    if (req.query.taskID) {
        taskID = req.query.taskID as string;
    }
    else {
        return res.status(400).json({
            'status': 'BAD_REQUEST',
            'message': 'taskID is required.'
        });
    }
    const result = await selectWordRetrievalTaskByTaskID(taskID);
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_REQUEST',
            'message': `Task with taskID ${req.query.taskID} not found.`,
        }); 
    }
    else {
        // Get the task IDs
        const taskSessions = await fetchAllPatientWordRetrievalTaskSessionsByTaskIDs([taskID]);

        // Create a map for quick lookup
        const taskSessionMap = new Map(taskSessions.map(session => [session.taskID, { taskSessionID: session.id, startedAt: session.startedAt, completedAt: session.completedAt }]));
        return res.status(200).json({
            'status': 'OK',
            'message': 'Task found.',
            'data': result[0],
            'taskSession': taskSessionMap.get(taskID)
        });
    }
}
