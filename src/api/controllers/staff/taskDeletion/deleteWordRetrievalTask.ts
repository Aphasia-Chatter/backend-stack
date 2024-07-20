import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import deleteWordRetrievalTaskByID from 'src/api/repositories/deleteWordRetrievalTaskByID';
import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';

export async function deleteWordRetrievalTask(
    req: Request,
    res: Response,
    staff: {
        username: string;
        id: string;
        hashedPassword: string;
    }
) {
    const taskId = req.body.selectedTaskId as string;

    if (!taskId) {
        return res.status(400).json({
            'status': 'MISSING_PARAMETERS',
            'message': 'Missing task ID.',
            'data': {}
        });
    }

    try {
        const task = await selectWordRetrievalTaskByTaskID(taskId);
        
        if (!task) {
            return res.status(404).json({
                'status': 'NOT_FOUND',
                'message': 'Task not found.',
                'data': {}
            });
        }

        const selectedTask = task[0];
        const wordRetrievalTask = selectedTask.word_retrieval_task;


        const deleteSuccess = await deleteWordRetrievalTaskByID(taskId);
        
        if (!deleteSuccess) {
            return res.status(500).json({
                'status': 'SERVER_ERROR',
                'message': 'Failed to delete the task.',
                'data': {}
            });
        }

        // Delete the associated image file
        if (wordRetrievalTask && wordRetrievalTask.imagePath && fs.existsSync(wordRetrievalTask.imagePath)) {
            deleteWordRetrievalTaskImage(wordRetrievalTask.imagePath);
        }

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'Task deleted successfully.',
            'data': {}
        });

    } catch (error: any) {
        console.error("Error during task deletion:", error);
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error!',
            'data': { error: error.message }
        });
    }
}

export default async function deleteWordRetrievalTaskImage(filePath: string): Promise<{ status: string, message: string }> {
    if (typeof filePath !== 'string' || filePath.trim() === '') {
        return {
            status: 'INVALID_INPUT',
            message: 'filePath should be a non-empty string'
        };
    }

    const absolutePath = path.resolve(filePath);

    try {
        await fs.promises.access(absolutePath, fs.constants.F_OK);
        await fs.promises.unlink(absolutePath);
        return {
            status: 'SUCCESS',
            message: `Image deleted successfully: ${filePath}`
        };
    } catch (err) {
        return {
            status: 'NOT_FOUND',
            message: `Image not found or unable to delete: ${filePath}`
        };
    }
}