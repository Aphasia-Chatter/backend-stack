import { db } from "src/db"
import { task, taskEditor, wordRetrievalTask, wordRetrievalTaskHint } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectWordRetrevialTaskByID(id: string) {
    return await db.select()
    .from(task)
    .where(eq(task.id, id))
    .innerJoin(wordRetrievalTask, eq(task.id, wordRetrievalTask.taskID))
    .innerJoin(taskEditor, eq(taskEditor.taskID, task.id))
    .fullJoin(wordRetrievalTaskHint, eq(wordRetrievalTaskHint.taskID, wordRetrievalTask.taskID))
}