import { db } from "src/db";
import { enrollmentCode, log, wordRetrievalSession } from "src/schema";
import { eq } from "drizzle-orm"

export default async function updateTaskSessionSuccessStatus(
    sessionTaskID: string,
    successStatus: boolean
) {
    try {
        await db.update(wordRetrievalSession).set(
            {isSuccessful: successStatus, completedAt: new Date()},
        ).where(eq(wordRetrievalSession.id, sessionTaskID))
    } catch (err) {
        await db.insert(log).values({
            message: `Failed updateTaskSessionSuccessStatus :: ${err}`,
            severity: "CRITICAL"
        })
    }
}