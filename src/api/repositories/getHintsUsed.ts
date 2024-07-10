import { db } from 'src/db';
import { wordRetrievalSession } from 'src/schema';
import { eq } from 'drizzle-orm';

const getHintsUsed = async (taskId: string) => {
  const sessionResult = await db.select({
    hintsUsedCount: wordRetrievalSession.hintsUsedCount,
  }).from(wordRetrievalSession)
    .where(eq(wordRetrievalSession.taskID, taskId))
    .execute();

  if (sessionResult.length === 0) {
    throw new Error('Data not found');
  }

  return sessionResult[0];
};

export default getHintsUsed;
