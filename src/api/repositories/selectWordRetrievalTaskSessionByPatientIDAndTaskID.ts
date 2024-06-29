import { db } from "src/db"
import { wordRetrievalSession } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function selectWordRetrievalTaskSessionByPatientIDAndTaskID(patientID: string, taskID: string) {
    return await db.select()
        .from(wordRetrievalSession)
        .where(and(
            eq(wordRetrievalSession.patientID, patientID),
            eq(wordRetrievalSession.taskID, taskID)
        ))
}