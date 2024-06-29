import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { inArray } from "drizzle-orm";

export default async function fetchAllPatientWordRetrievalTaskSessionsByTaskIDs(taskIDs: string[]) {
    return await db.select()
    .from(wordRetrievalSession)
    .where(inArray(wordRetrievalSession.taskID, taskIDs));
}