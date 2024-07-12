import { db } from "src/db"
import { wordRetrievalSession, log } from "src/schema";

export default async function insertWordRetrievalTaskSession(
    patientID: string,
    taskID: string
) {
    try {
        return await db.insert(wordRetrievalSession).values({
            patientID: patientID,
            taskID: taskID,
            hintsUsedCount: 0,
        }).returning();
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create word retrieval task session :: ${err}`,
            severity: "CRITICAL"
        })
        throw err
    }
}