import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq, isNotNull, and, sql } from "drizzle-orm";

export default async function getNumberOfCompletedAssessments(patientId: string, today: string) {
  const countResult = await db.select({ count: sql`COUNT(*)` })
    .from(wordRetrievalSession)
    .where(and(
      eq(wordRetrievalSession.patientID, patientId),
      isNotNull(wordRetrievalSession.startedAt),
      isNotNull(wordRetrievalSession.completedAt)
    ))
    .execute();

  return countResult[0].count; // Assuming count() returns an array with the count in the first element
}
