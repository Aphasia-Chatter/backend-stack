import { Request, Response } from 'express';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';

import fs from 'fs';
import { configureWordRetrevialTask } from './configureWordRetrevialTask';

export enum TaskType {
    WORD_RETREVIAL
}

/**
 * Configures a task based on the provided task type.
 *
 * @param {Request} req - The request object containing the task details.
 * @param {Response} res - The response object to send the result.
 * @param {TaskType} taskType - The type of task to configure.
 */
export default async function configureTask(req: Request, res: Response, taskType: TaskType){
    const username = req.body.username as string;
    const validationResponse = await validateStaffRequest(req, username)

    if (!validationResponse.isValid) {
        deleteUploadedFile(req)
        return res.status(400).json({
            'status': validationResponse.status,
            'message': validationResponse.message,
            'data': {}
        });
    }

    const taskID = req.body.task_id as string;
    if (!taskID) {
        deleteUploadedFile(req)
        return res.status(400).json({
            'status': 'TASK_ID_REQUIRED',
            'message': 'Missing parameter of task_id',
            'data': {}
        });
    }

    if (taskType == TaskType.WORD_RETREVIAL) {
        return await configureWordRetrevialTask(req, res, validationResponse.staff!, taskID)
    } else {
        deleteUploadedFile(req)
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!',
            'data': {}
        });
    }
}

/**
 * Deletes the uploaded file if it exists in the request.
 * Useful for removing the file if the request is invalidated.
 *
 * @param {Request} req - The request object containing the file to be deleted.
 */
function deleteUploadedFile(req: Request) {
    if (req.file) {
        fs.unlinkSync(req.file.path);
    }
}