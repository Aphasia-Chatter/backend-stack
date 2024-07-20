import { db } from "src/db"
import { asc, desc, eq } from "drizzle-orm"
import { wordRetrievalSessionMessage } from "src/schema"

export default async function selectSessionMessagesBySessionID(
    sessionID: string,
    limit: number = 100,
    offset: number = 0,
    order: 'desc' | 'asc' = 'desc'
) {
    const orderByFn = order === 'desc' ? desc(wordRetrievalSessionMessage.sentAt) : asc(wordRetrievalSessionMessage.sentAt);

    return await db.select().from(wordRetrievalSessionMessage)
      .where(eq(wordRetrievalSessionMessage.sessionID, sessionID))
      .orderBy(orderByFn)
      .limit(limit)
      .offset(offset);
}