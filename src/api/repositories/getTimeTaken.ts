import { db } from 'src/db';
import { wordRetrievalSession } from 'src/schema';
import { eq } from 'drizzle-orm';

const getTimeTaken = async (taskId: string) => {
  try {
    const sessionResult = await db
      .select({
        startedAt: wordRetrievalSession.startedAt,
        completedAt: wordRetrievalSession.completedAt,
      })
      .from(wordRetrievalSession)
      .where(eq(wordRetrievalSession.taskID, taskId))
      .execute();

    if (sessionResult.length === 0) {
      throw new Error('Data not found');
    }

    const { startedAt, completedAt } = sessionResult[0];
    if (!startedAt) {
      throw new Error('Invalid data');
    }

    if (!completedAt) {
      return { status: 'Incomplete' };
    }

    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(completedAt).getTime();
    const timeTaken = endTime - startTime;

    const hours = Math.floor(timeTaken / (1000 * 60 * 60));
    const minutes = Math.floor((timeTaken % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeTaken % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, status: 'Completed' };
  } catch (error) {
    console.error('Error fetching time taken:', error);
    throw new Error('An error occurred while fetching time taken');
  }
};

export default getTimeTaken;
