import { db } from 'src/db';
import { wordRetrievalSession, task } from 'src/schema';
import { eq, isNotNull, and, desc } from 'drizzle-orm';

interface TaskSession {
  taskName: string;
  completedAt: string;
  taskId: string;
}

export default async function getRecentCompletedTaskSessions(patientId: string): Promise<TaskSession[]> {
  try {
    const results = await db
      .select({
        taskName: task.name,
        completedAt: wordRetrievalSession.completedAt,
        taskId: wordRetrievalSession.taskID, // Ensure taskId is included
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

    return results.map(result => ({
      taskName: result.taskName,
      completedAt: result.completedAt ? result.completedAt.toISOString() : "",
      taskId: result.taskId, // Map taskId properly
    }));
  } catch (error) {
    console.error("Error fetching task sessions:", error);
    throw new Error("An error occurred while fetching task sessions.");
  }
}
