import { db } from "src/db"
import { wordRetrievalSession, log } from "src/schema";

export default async function insertWordRetrievalTaskSession(
    patientID: string,
    taskID: string
) {
    try {
        await db.insert(wordRetrievalSession).values({
            patientID: patientID,
            taskID: taskID,
            hintsUsedCount: 0
        })
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create word retrieval task session :: ${err}`,
            severity: "CRITICAL"
        })
    }
}