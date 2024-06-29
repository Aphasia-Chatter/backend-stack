import { db } from "src/db";
import { task, taskEditor, wordRetrievalTask, staff } from "src/schema";
import { eq, and } from "drizzle-orm";

export default async function fetchAllPatientWordRetrievalTasksByStaffID(staffID: string) {
    const results = await db.selectDistinct()
        .from(wordRetrievalTask)
        .innerJoin(task, eq(task.id, wordRetrievalTask.taskID))
        .innerJoin(taskEditor, eq(taskEditor.taskID, task.id))
        .innerJoin(staff, eq(staff.id, taskEditor.staffID))
        .where(and(eq(task.taskVisibility, "unlisted"), eq(staff.id, staffID)))

    // Use a Set to store unique task IDs
    const seenTaskIDs = new Set();
    const uniqueResults = [];

    for (const result of results) {
        if (!seenTaskIDs.has(result.task.id)) {
            seenTaskIDs.add(result.task.id);
            uniqueResults.push(result);
        }
    }

    return uniqueResults;
}