import { db } from 'src/db';
import { wordRetrievalSession } from 'src/schema';
import { eq } from 'drizzle-orm';

const getSessionIdByTaskId = async (taskId: string) => {
  try {
    const session = await db
      .select({
        id: wordRetrievalSession.id,
      })
      .from(wordRetrievalSession)
      .where(eq(wordRetrievalSession.taskID, taskId))
      .execute();

    if (session.length === 0) {
      throw new Error('No session found for the given task ID');
    }

    return session[0].id;
  } catch (error) {
    console.error('Error fetching session ID:', error);
    throw new Error('An error occurred while fetching session ID');
  }
};

export default getSessionIdByTaskId;
