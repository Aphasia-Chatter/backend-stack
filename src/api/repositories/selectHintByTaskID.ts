import { and, eq } from "drizzle-orm";
import { PgEnum, uuid } from "drizzle-orm/pg-core";
import { db } from "src/db";
import { 
    wordRetrievalTask,
    wordRetrievalTaskHint,
 } from "src/schema";

export default async function selectHintByTaskID(
    taskID: string,
    hintNumber: number
) {
    return await db.select().from(wordRetrievalTaskHint).where(and(
        eq(wordRetrievalTaskHint.taskID, taskID),
        eq(wordRetrievalTaskHint.id, hintNumber)
    ))
}