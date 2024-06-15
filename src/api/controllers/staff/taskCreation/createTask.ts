import { Request, Response } from 'express';
import validateStaffRequest from 'src/api/utils/validStaffRequest';

export enum TaskType {
    WORD_RETREVIAL
}

export default async function createTask(req: Request, res: Response, taskType: TaskType){
    const username = req.body.username as string;
    const validationResponse = await validateStaffRequest(req, username)
}