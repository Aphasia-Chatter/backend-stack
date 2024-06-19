import { eq, and, ne, ilike } from "drizzle-orm";
import { db } from "src/db";
import { task, wordRetrievalTask, taskEditor } from "src/schema";

export default async function getStaffWordRetrevialTasks(
    staffID: string,
    nameFilter: string,
    visiblity: "public" | "unlisted" | "editors_patient_only" | ""
) {
    // Filter visiblity/name if they are not blank
    const visibilityFilter = visiblity ? eq(task.taskVisibility, visiblity) : undefined;
    const nameFilterCondition = nameFilter.trim() ? ilike(task.name, `%${nameFilter.trim()}%`) : undefined;

    return await db.select()
    .from(taskEditor)
    .where( and (
        eq(taskEditor.staffID, staffID),
        visibilityFilter,
        nameFilterCondition
    ))
    .innerJoin(task, eq(task.id, taskEditor.taskID))
    .innerJoin(wordRetrievalTask, eq(wordRetrievalTask.taskID, task.id))
}
