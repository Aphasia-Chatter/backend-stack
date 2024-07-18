import { db } from "src/db"
import { eq } from "drizzle-orm"
import { wordRetrievalSession, wordRetrievalTask } from "src/schema"

export default async function selectTaskSessionByID(sessionID: string) {
    return await db.select().from(wordRetrievalSession).where(eq(wordRetrievalSession.id, sessionID))
}