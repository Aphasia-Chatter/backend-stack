import { db } from "src/db"
import { wordRetrievalSessionMessage } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectMessageByID(messageID: string) {
    return await db.select().from(wordRetrievalSessionMessage).where(eq(wordRetrievalSessionMessage.id, messageID))
}