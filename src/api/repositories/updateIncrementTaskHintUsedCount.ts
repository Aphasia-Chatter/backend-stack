import { db } from "src/db";
import { enrollmentCode, log, wordRetrievalSession } from "src/schema";
import { eq } from "drizzle-orm"

export default async function updateIncrementTaskHintUsedCount(
    sessionTaskID: string
) {
    try {
        await db.transaction(async (tx) => {
            const session = await tx.select().from(wordRetrievalSession).where(eq(wordRetrievalSession.id, sessionTaskID))
            if (session.length <= 0){
                await db.insert(log).values({
                    message: `Failed updateIncrementTaskHintUsedCount :: session of ID ${sessionTaskID} not found`,
                    severity: "WARNING"
                })
                return
            }

            await tx.update(wordRetrievalSession).set(
                {hintsUsedCount: session[0].hintsUsedCount + 1}
            ).where(eq(wordRetrievalSession.id, sessionTaskID))
        })
    } catch (err) {
        await db.insert(log).values({
            message: `Failed updateIncrementTaskHintUsedCount :: ${err}`,
            severity: "CRITICAL"
        })
    }
}