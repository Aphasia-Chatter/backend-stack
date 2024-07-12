import { db } from 'src/db';
import { wordRetrievalSession } from 'src/schema';
import { eq } from 'drizzle-orm';

const getAnswerStatus = async (taskId: string) => {
  try {
    const result = await db
      .select({
        isSuccessful: wordRetrievalSession.isSuccessful,
      })
      .from(wordRetrievalSession)
      .where(eq(wordRetrievalSession.taskID, taskId))
      .execute();

    if (result.length === 0) {
      throw new Error('No result found for the given task ID');
    }

    return result[0].isSuccessful;
  } catch (error) {
    console.error('Error fetching answer status:', error);
    throw new Error('An error occurred while fetching answer status');
  }
};

export default getAnswerStatus;
