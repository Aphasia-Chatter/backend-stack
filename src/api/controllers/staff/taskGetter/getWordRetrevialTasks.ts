import { Request, Response } from 'express';

import fs from 'fs';
import getStaffWordRetrevialTasks from 'src/api/repositories/getStaffWordRetrevialTasks';
import insertLog from 'src/api/repositories/insertLog';

/**
 * For staff usage; See `getPatientWordRetrevialTasks` for fetching as a patient.
 * @param req 
 * @param res 
 * @param staff 
 * @returns 
 */
export async function getWordRetrevialTasks(
    req: Request,
    res: Response,
    staff: {
        username: string;
        id: string;
        hashedPassword: string;
    }
) {
    let nameFilter = (req.query.name as string ?? "").trim();
    let visbilityFilter = req.query.visibility as string ?? "";

    if (!(visbilityFilter == "public" || visbilityFilter == "unlisted" || visbilityFilter == "editors_patient_only" || visbilityFilter == "")) {
        return res.status(400).json({
            'status': 'INVALID_VISIBILITY_FILTER',
            'message': 'Invalid visibility filter. (visibility: ' + visbilityFilter + ')',
            'data': {
                "valid_visibility_filters": ["public", "unlisted", "editors_patient_only", ""]
            }
        });
    }

    try {
        const tasks = await getStaffWordRetrevialTasks(staff.id, nameFilter, visbilityFilter);

        if (tasks.length > 0) {
            const formattedResult = []
            for (let i = 0; i < tasks.length; i++) {
                const currentTask = tasks[i]
                formattedResult.push({
                    id: currentTask.task.id,
                    name: currentTask.task.name,
                    description: currentTask.task.description,
                    visibility: currentTask.task.taskVisibility,
                    answer: currentTask.word_retrieval_task.answer,
                    role: currentTask.task_editor.role,
                    created_at: currentTask.task.createdAt,
                })
            }
            return res.status(200).json({
                status: "SUCCESS",
                message: "Successfully retrieved tasks!",
                data: {
                    tasks: tasks
                }
            })
        } else {
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No word retrieval tasks found!',
                'data': {}
            }); 
        }
    
    } catch (error: any) {
        
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

