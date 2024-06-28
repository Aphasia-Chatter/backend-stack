import { db } from "src/db"
import { wordRetrievalSession, log } from "src/schema";

export default async function insertWordRetrievalSession(
    patient_id: string,
    task_id: string
) {
    try {
        await db.insert(wordRetrievalSession).values({
            patientID: patient_id,
            taskID: task_id,
            hintsUsedCount: 0,
            startedAt: , //I not sure what to put here
            completedAt: 
        })
    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create word retrieval task :: ${err}`,
            severity: "CRITICAL"
        })
    }
}