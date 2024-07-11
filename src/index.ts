import { db } from 'src/db';
import { wordRetrievalSessionMessage } from 'src/schema';
import { eq } from 'drizzle-orm';

export const getTaskMessages = async (sessionId: string) => {
  try {
    const messages = await db
      .select()
      .from(wordRetrievalSessionMessage)
      .where(eq(wordRetrievalSessionMessage.sessionID, sessionId)); // Corrected the query syntax

    return messages;
  } catch (error) {
    throw new Error('Error fetching task messages');
  }
};
