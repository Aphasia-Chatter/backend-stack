import { Request, Response } from 'express';

import fs from 'fs';
import { ALLOWED_IMAGE_TYPES } from 'src/api/config/allowedImageFiles';
import { WORD_RETREVIAL_REQUEST_MAX_LENGTHS } from 'src/api/config/requestInputLengths';
import insertLog from 'src/api/repositories/insertLog';
import insertWordRetrevialTask from 'src/api/repositories/insertWordRetrevialTask';
import selectTaskByName from 'src/api/repositories/selectTaskByName';
import { taskEditorRoleEnum } from 'src/schema';

export async function createWordRetrevialTask(
    req: Request,
    res: Response,
    staff: {
        username: string;
        id: string;
        hashedPassword: string;
    }
) {
    let taskName = req.body.name as string;
    const taskDescription = (req.body.description as string ?? "").trim();
    let taskAnswer = req.body.answer as string;

    if (!req.file) {
        return res.status(400).json({
            'status': 'MISSING_IMAGE',
            'message': 'Missing image file. (image: null)',
            'data': {}
        });
    }

    const filePath = req.file.path;
    if (!taskName || !taskAnswer) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            'status': 'MISSING_PARAMETERS',
            'message': `Missing parameter. Echo: (name: '${taskName}'), (description: '${taskDescription}'), (answer: '${taskAnswer}')`,
            'data': {}
        });
    }

    if (!taskName.trim() || !taskAnswer.trim()) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            'status': 'BLANK_PARAMETERS',
            'message': `Some of the parameters are whitespace or blanks! Echo: (name: '${taskName}'), (description: '${taskDescription}'), (answer: '${taskAnswer}')`,
            'data': {}
        });
    }
    taskName = taskName.trim()
    taskAnswer = taskAnswer.trim()

    if (taskName.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.name) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            status: "NAME_TOO_LONG",
            message: `Task name is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.name}`,
            data: {}
        });
    }

    if (taskDescription.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.description) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            status: "DESCRIPTION_TOO_LONG",
            message: `Task description is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.description}`,
            data: {}
        });
    }

    if (taskAnswer.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.answer) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            status: "ANSWER_TOO_LONG",
            message: `Task answer is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.answer}`,
            data: {}
        });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        deleteUploadedFile(filePath);
        return res.status(400).json({
            status: "BAD_IMAGE_TYPE",
            message: `Invalid image type. Expected one of ${ALLOWED_IMAGE_TYPES.join(', ')}`,
            data: {}
        });
    }

    try {
        const existingTasks = await selectTaskByName(taskName);
        if (existingTasks.length > 0) { 
            deleteUploadedFile(filePath);
            return res.status(400).json({
                status: "NAME_CONFLICT",
                message: "A task with the same name already exists!",
                data: {
                    "existing_task_id": existingTasks[0].id
                }
            });
        }

        const newTaskID = await insertWordRetrevialTask(taskName, taskDescription, staff.id, taskAnswer, filePath);
        if (!newTaskID) {
            deleteUploadedFile(filePath);
            return res.status(500).json({
                status: "SERVER_ERROR",
                message: "Server encountered an error!",
                data: {}
            });
        }

        return res.status(200).json({
            status: "SUCCESS",
            message: "New task was successfully created",
            data: {
                "task_id": newTaskID
            }
        });

    } catch (error: any) {
        if (filePath) {
            deleteUploadedFile(filePath);
        }
        
        console.error("Error during image upload:", error);
        return res.status(500).json({
            status: "SERVER_ERROR",
            message: "Server encountered an error!"
        })
    }
}

/**
 * Copies a file from the source path to the destination path. If the destination path
 * does not exist, it creates the necessary directories. Returns a boolean indicating
 * whether the file was successfully copied.
 *
 * @param {string} filePath - The path of the file to be copied.
 * @param {string} destinationPath - The path where the file should be copied to.
 * @return {boolean} Boolean indicating whether the file was successfully copied.
 */
function copyFileToDestination(filePath: string, destinationPath: string) {
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }
    fs.copyFileSync(filePath, destinationPath);
    return fs.existsSync(destinationPath);
}


function deleteUploadedFile(filePath: string) {
    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("Error deleting file (createWordRetrevialTask) :: ", error);
        insertLog("Error deleting file (createWordRetrevialTask) :: " + error, "CRITICAL").then(() => {});
    }
}

