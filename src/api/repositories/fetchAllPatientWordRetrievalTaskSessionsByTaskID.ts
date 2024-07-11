import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq } from "drizzle-orm";

export default async function fetchAllPatientWordRetrievalTaskSessionsByTaskID(taskID: string) {
    return await db.select()
        .from(wordRetrievalSession)
        .where(eq(wordRetrievalSession.taskID, taskID));
}