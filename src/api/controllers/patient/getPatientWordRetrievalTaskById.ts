import { Request, Response } from 'express';

import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';

export default async function getPatientWordRetrievalTaskById(req: Request, res: Response) {
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
        return res.status(200).json({
            'status': 'OK',
            'message': 'Task found.',
            'data': result[0]
        });
    }
}
