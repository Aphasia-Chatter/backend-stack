import { eq } from "drizzle-orm";
import { db } from "src/db";
import { log, task, wordRetrievalTask } from "src/schema";

export async function updateWordRetrevialTaskByID(
    id: string,
    name: string,
    description: string,
    answer: string,
    visibility: "unlisted" | "public" | "editors_patient_only",
    imagePath: string
) {
    try {
        await db.transaction(async (tx) => {
            await tx.update(wordRetrievalTask)
            .set({
                answer: answer,
                imagePath: imagePath
            }).where(eq(wordRetrievalTask.taskID, id))

            await tx.update(task).set({
                name: name,
                description: description,
                taskVisibility: visibility
            }).where(eq(task.id, id))
        })
        return true
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create a new word retrevial task :: ${err}`,
            severity: "CRITICAL"
        })
        console.error(`Failed to create a new word retrevial task :: ${err}`)
        return false
    }
}