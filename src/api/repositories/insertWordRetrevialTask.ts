import { db } from "src/db";
import { 
    wordRetrievalTask,
    task,
    taskEditor,
    log
 } from "src/schema";

export default async function insertWordRetrevialTask(
    name: string,
    description: string,
    staffID: string,
    taskAnswer: string,
    imagePath: string,
    taskVisibility: "unlisted" | "public" | "editors_patient_only" = "unlisted"
) {
    try {
        let taskID = ""
        await db.transaction(async (tx) => {
            const newTask = await tx.insert(task).values({
                name: name,
                description: description,
                taskVisibility: taskVisibility
            }).returning();

            taskID = newTask[0].id
            await tx.insert(taskEditor).values({
                taskID: taskID,
                staffID: staffID
            })

            await tx.insert(wordRetrievalTask).values({
                taskID: taskID,
                imagePath: imagePath,
                answer: taskAnswer
            })
        });
        
        return taskID;
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create a new word retrevial task :: ${err}`,
            severity: "CRITICAL"
        })
        console.error(`Failed to create a new word retrevial task :: ${err}`)
    }
}