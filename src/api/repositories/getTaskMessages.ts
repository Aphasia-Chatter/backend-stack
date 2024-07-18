import { db } from 'src/db';
import { wordRetrievalSessionMessage } from 'src/schema';
import { eq } from 'drizzle-orm';

const getTaskMessages = async (sessionId: string) => {
  try {
    const messages = await db
      .select({
        content: wordRetrievalSessionMessage.content,
        author: wordRetrievalSessionMessage.author,
        sentAt: wordRetrievalSessionMessage.sentAt,
      })
      .from(wordRetrievalSessionMessage)
      .where(eq(wordRetrievalSessionMessage.sessionID, sessionId))
      .orderBy(wordRetrievalSessionMessage.sentAt)
      .execute();

    if (messages.length === 0) {
      throw new Error('No messages found for the given session ID');
    }

    return messages.map((message, index) => {
      return {
        author: message.author,
        content: message.content,
        isFirst: index === 0,
      };
    });
  } catch (error) {
    console.error('Error fetching task messages:', error);
    throw new Error('An error occurred while fetching task messages');
  }
};

export default getTaskMessages;
