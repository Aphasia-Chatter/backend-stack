import { db } from 'src/db';
import { wordRetrievalSession } from 'src/schema';
import { eq } from 'drizzle-orm';

interface SuccessPercentage {
  correctAnswersPercentage: number;
}

export default async function getSuccessPercentage(patientId: string): Promise<SuccessPercentage> {
  try {
    const results = await db
      .select({
        isSuccessful: wordRetrievalSession.isSuccessful
      })
      .from(wordRetrievalSession)
      .where(eq(wordRetrievalSession.patientID, patientId))
      .execute();

    const totalCount = results.length;
    const correctCount = results.filter(result => result.isSuccessful).length;
    const correctAnswersPercentage = totalCount > 0 ? correctCount / totalCount : 0;

    return { correctAnswersPercentage };
  } catch (error) {
    console.error("Error fetching success percentage:", error);
    throw new Error("An error occurred while fetching the success percentage.");
  }
}
