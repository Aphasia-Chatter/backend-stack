import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function updateWordRetrievalTaskSessionByID(
    wordRetrievalSessionID: string,
    patientID: string,
    hintsUsedCount: number,
    completedAt: Date,
) {
    await db.update(wordRetrievalSession)
        .set({ 
            hintsUsedCount: hintsUsedCount,
            completedAt: completedAt
         })
        .where(and(
            eq(wordRetrievalSession.id, wordRetrievalSessionID),
            eq(wordRetrievalSession.patientID, patientID)
        ));
}