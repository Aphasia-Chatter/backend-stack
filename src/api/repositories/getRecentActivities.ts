import { db } from "src/db";
import { wordRetrievalSession } from "src/schema";
import { eq, sql } from "drizzle-orm";

export default async function getRecentActivities(patientId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const result = await db.select({
    day: sql`DATE_TRUNC('day', completed_at)`.as('day'),
    count: sql`COUNT(*)`.as('count')
  })
  .from(wordRetrievalSession)
  .where(sql`${wordRetrievalSession.patientID} = ${patientId} AND completed_at IS NOT NULL AND completed_at >= ${oneWeekAgo.toISOString()}`)
  .groupBy(sql`DATE_TRUNC('day', completed_at)`)
  .orderBy(sql`DATE_TRUNC('day', completed_at)`)
  .execute();

  return result;
}
