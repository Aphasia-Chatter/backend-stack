import { Request, Response } from 'express';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';
import fs from 'fs';
import { getWordRetrevialTasks } from './getWordRetrevialTasks';

export enum TaskType {
    WORD_RETREVIAL
}

export default async function getTask(req: Request, res: Response, taskType: TaskType){
    const username = req.query.username as string;
    const validationResponse = await validateStaffRequest(req, username)

    if (!validationResponse.isValid) {
        return res.status(400).json({
            'status': validationResponse.status,
            'message': validationResponse.message,
            'data': {}
        });
    }

    if (taskType == TaskType.WORD_RETREVIAL) {
        return await getWordRetrevialTasks(req, res, validationResponse.staff!)
    } else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!',
            'data': {}
        });
    }
}