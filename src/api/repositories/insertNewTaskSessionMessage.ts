import { db } from "src/db"
import { wordRetrievalSessionMessage } from "src/schema"

export default async function insertNewTaskSessionMessage(
    sessionID: string,
    author: 'user' | 'system' | 'bot',
    content: string
) {
    return await db.insert(wordRetrievalSessionMessage).values({
        sessionID,
        author,
        content
    })
}