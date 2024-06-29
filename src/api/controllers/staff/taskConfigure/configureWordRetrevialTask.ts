import { Request, Response } from 'express';

import fs from 'fs';
import { ALLOWED_IMAGE_TYPES } from 'src/api/config/allowedImageFiles';
import { WORD_RETREVIAL_REQUEST_MAX_LENGTHS } from 'src/api/config/requestInputLengths';
import insertLog from 'src/api/repositories/insertLog';
import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import selectTaskByName from 'src/api/repositories/selectTaskByName';
import { updateWordRetrevialTaskByID } from 'src/api/repositories/updateWordRetrevialTaskByID';

export async function configureWordRetrevialTask(
    req: Request,
    res: Response,
    staff: {
        username: string;
        id: string;
        hashedPassword: string;
    },
    taskID: string
) {
   try { 
        const matchingTasks = await selectWordRetrievalTaskByTaskID(taskID)
        if (matchingTasks.length <= 0) {
            deleteUploadedFile(req);
            return res.status(400).json({
                status: "TASK_NOT_FOUND",
                message: "Task not found!",
                data: {}
            })
        }

        // Check if staff has permission to modify the task
        let targetTask = null
        for (let i = 0; i < matchingTasks.length; i++) {
            const currentTask = matchingTasks[i]

            if (currentTask.task_editor!.staffID == staff.id && currentTask.task_editor!.role != "none") {
                targetTask = matchingTasks[i]
                break
            }
        }

        if (targetTask == null) {
            deleteUploadedFile(req);
            return res.status(400).json({
                status: "PERMISSION_DENIED",
                message: "The staff do not have enough permissions to modify the task!",
                data: {}
            })
        }


        const taskName = (req.body.name as string ?? targetTask.task!.name).trim()
        const taskDescription = (req.body.description as string ?? targetTask.task!.description ?? "").trim()
        const taskVisibility = (req.body.visibility as string ?? targetTask.task!.taskVisibility).trim()
        const taskAnswer = (req.body.answer as string ?? targetTask.word_retrieval_task!.answer).trim()

//#region Input Field Validation
        if (!taskName || !taskAnswer || !taskVisibility) {
            deleteUploadedFile(req);
            return res.status(400).json({
                'status': 'BLANK_PARAMETERS',
                'message': `Missing parameter. Echo: (name: '${taskName}'), (description: '${taskDescription}'), (visibility: '${taskVisibility}'), (answer: '${taskAnswer}')`,
                'data': {}
            });
        }

        if (taskName.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.name) {
            deleteUploadedFile(req);
            return res.status(400).json({
                status: "NAME_TOO_LONG",
                message: `Task name is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.name}`,
                data: {}
            });
        }
    
        if (taskDescription.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.description) {
            deleteUploadedFile(req);
            return res.status(400).json({
                status: "DESCRIPTION_TOO_LONG",
                message: `Task description is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.description}`,
                data: {}
            });
        }
    
        if (taskAnswer.length >= WORD_RETREVIAL_REQUEST_MAX_LENGTHS.answer) {
            deleteUploadedFile(req);
            return res.status(400).json({
                status: "ANSWER_TOO_LONG",
                message: `Task answer is too long! MAX: ${WORD_RETREVIAL_REQUEST_MAX_LENGTHS.answer}`,
                data: {}
            });
        }

        if (!(taskVisibility == 'unlisted' || taskVisibility == 'editors_patient_only' || taskVisibility == 'public')) {
            deleteUploadedFile(req);
            return res.status(400).json({
                'status': 'INVALID_VISIBILITY',
                'message': `Invalid visibility. Echo: (visibility: '${taskVisibility}')`,
                'data': {
                    'valid_visibilities': ['unlisted', 'editors_patient_only', 'public'],
                }
            });
        }
//#endregion

        if (req.body.name && (req.body.name.trim() != targetTask.task!.name)) {
            const existingTask = await selectTaskByName(taskName)

            if (existingTask.length > 0) {
                deleteUploadedFile(req);
                return res.status(400).json({
                    status: "NAME_CONFLICT",
                    message: "Task with the input name already exists!",
                    data: {
                        'existing_task_id': existingTask[0].id
                    }
                })
            }
        }

//#region Uploaded file validation
        let filePath = targetTask.word_retrieval_task!.imagePath
        let originalFilePath = ""
        if (req.file) {
            originalFilePath = filePath
            filePath = req.file.path
           
            if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
                deleteUploadedFile(req);
                return res.status(400).json({
                    status: "BAD_IMAGE_TYPE",
                    message: `Invalid image type. Expected one of ${ALLOWED_IMAGE_TYPES.join(', ')}`,
                    data: {}
                });
            }
        }
//#endregion

        if (await updateWordRetrevialTaskByID(taskID, taskName, taskDescription, taskAnswer, taskVisibility, filePath)) {
            if (originalFilePath) {
                fs.unlinkSync(originalFilePath)
            }

            return res.status(200).json({
                status: "SUCCESS",
                message: "Successfully updated task!",
                data: {
                    "task_id": taskID
                }
            })
        } else {
            deleteUploadedFile(req);
            return res.status(500).json({
                status: "SERVER_ERROR",
                message: "Server encountered an error!",
                data: {}
            })
        }
    } catch (error: any) {
        deleteUploadedFile(req);
        
        console.error("Error during image upload:", error);
        return res.status(500).json({
            status: "SERVER_ERROR",
            message: "Server encountered an error!",
            data: {}
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


function deleteUploadedFile(req: Request) {
    try {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    } catch (error) {
        console.error("Error deleting file (createWordRetrevialTask) :: ", error);
        insertLog("Error deleting file (createWordRetrevialTask) :: " + error, "CRITICAL").then(() => {});
    }
}
