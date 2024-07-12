import { Request, Response } from 'express';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';
import { deleteWordRetrievalTask } from './deleteWordRetrievalTask';
import fs from 'fs';

export enum TaskType {
    WORD_RETREVIAL
}

export default async function handleTask(req: Request, res: Response, taskType: TaskType){
    const username = req.body.username as string;
    const validationResponse = await validateStaffRequest(req, username)

    if (!validationResponse.isValid) {
        deleteUploadedFile(req);
        return res.status(400).json({
            'status': validationResponse.status,
            'message': validationResponse.message,
            'data': {}
        });
    }

    if (taskType == TaskType.WORD_RETREVIAL) {
        return await deleteWordRetrievalTask(req, res, validationResponse.staff!)
    } else {
        deleteUploadedFile(req);
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
