import { db } from "src/db";
import { wordRetrievalSession, task } from "src/schema";
import { eq, isNotNull, and, desc } from "drizzle-orm";


interface TaskSession {
  taskName: string;
  completed_at: string;
}

// Helper function to format the date
function formatDate(dateString: string | null): string {
  if (!dateString) return "";  // Handle null or undefined dates

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  // Format the day with suffix (e.g., 1st, 2nd, 3rd, 4th, ...)
  const suffix = day % 10 === 1 && day !== 11 ? 'st' :
                 day % 10 === 2 && day !== 12 ? 'nd' :
                 day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix} ${month} ${year} Assessment`;
}

export default async function getRecentCompletedTaskSessions(patientId: string): Promise<TaskSession[]> {
  try {
    const results = await db
      .select({
        taskName: task.name,
        completedAt: wordRetrievalSession.completedAt,
      })
      .from(wordRetrievalSession)
      .innerJoin(task, eq(wordRetrievalSession.taskID, task.id))
      .where(
        and(
          eq(wordRetrievalSession.patientID, patientId),
          isNotNull(wordRetrievalSession.startedAt),
          isNotNull(wordRetrievalSession.completedAt)
        )
      )
      .orderBy(desc(wordRetrievalSession.completedAt))
      .execute();

    // Map through the results to format the completed_at values
    const formattedResults = results.map(result => ({
      taskName: result.taskName,
      completed_at: result.completedAt ? formatDate(result.completedAt.toISOString()) : ""
    }));

    return formattedResults;
  } catch (error) {
    console.error("Error fetching task sessions:", error);
    throw new Error("An error occurred while fetching task sessions.");
  }
}
