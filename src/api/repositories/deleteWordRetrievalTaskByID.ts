import { db } from "src/db";
import { log, task, taskEditor, wordRetrievalTask } from "src/schema";
import { eq } from "drizzle-orm"

export default async function deleteWordRetrievalTask(taskID: string) {
    try {
        await db.transaction(async (tx) => {
            // Delete from wordRetrievalTask table
            await tx.delete(wordRetrievalTask).where(eq(wordRetrievalTask.taskID, taskID));;

            // Delete from taskEditor table
            await tx.delete(taskEditor).where(eq(taskEditor.taskID, taskID));

            // Delete from task table
            await tx.delete(task).where(eq(task.id, taskID));
        });

        return true;
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to delete the word retrieval task :: ${err}`,
            severity: "CRITICAL"
        });
        console.error(`Failed to delete the word retrieval task :: ${err}`);
        return false;
    }
}