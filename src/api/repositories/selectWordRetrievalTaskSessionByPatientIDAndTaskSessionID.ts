import { db } from "src/db"
import { wordRetrievalSession } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID(patientID: string, taskSessionID: string) {
    return await db.select()
        .from(wordRetrievalSession)
        .where(and(
            eq(wordRetrievalSession.patientID, patientID),
            eq(wordRetrievalSession.id, taskSessionID)
        ))
}