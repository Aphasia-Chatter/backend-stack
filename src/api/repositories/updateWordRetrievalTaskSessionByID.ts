import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function updateWordRetrievalTaskSessionByID(
    wordRetrievalSessionID: string,
    patientID: string,
    hintsUsedCount: number,
    completedAt: string, // How to set timestamp
) {
    await db.update(wordRetrievalSession)
        .set({ 
            hintsUsedCount: hintsUsedCount,
            completedAt: completedAt // How to set timestamp
         })
        .where(and(
            eq(wordRetrievalSession.id, wordRetrievalSessionID),
            eq(wordRetrievalSession.patientID, patientID)
        ));
}