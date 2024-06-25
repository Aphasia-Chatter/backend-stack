import { TaskCompletionStatus } from "../controllers/enums/TaskCompletionStatus";
import { db } from "src/db";
import { createOne, and, eq, ilike, desc } from "drizzle-orm";
import {
  staff,
  taskEditor,
  task,
  wordRetrievalTask,
  patient_staff,
  wordRetrievalSession,
} from "src/schema";

export default async function selectPatientWordRetrievalTasksWithFilters(
  patientID: string,
  nameFilter: string | undefined = "",
  creatorNameFilter: string | undefined = "",
  completionStatusFilter: TaskCompletionStatus | undefined,
  creatorIsPatientStaff = false,
  maxSelection = 100,
  selectionOffset = 0
) {
  const nameFilterCondition = nameFilter.trim()
    ? ilike(task.name, `%${nameFilter.trim()}%`)
    : undefined;
  const authorFilterCondition = creatorNameFilter.trim()
    ? ilike(staff.username, `%${creatorNameFilter.trim()}%`)
    : undefined;

  const rows = await db
    .select()
    .from(wordRetrievalTask)
    .innerJoin(task, eq(wordRetrievalTask.taskID, task.id))
    .innerJoin(taskEditor, eq(taskEditor.taskID, task.id))
    .innerJoin(staff, eq(staff.id, taskEditor.staffID))
    .leftJoin(patient_staff, eq(patient_staff.patientID, patientID))
    .leftJoin(
      wordRetrievalSession,
      and(
        eq(wordRetrievalSession.patientID, patientID),
        eq(wordRetrievalSession.taskID, task.id)
      )
    )
    .where(and(nameFilterCondition, authorFilterCondition))
    .offset(selectionOffset)
    .limit(maxSelection)
    .orderBy(desc(task.createdAt), desc(wordRetrievalSession.startedAt));

  const results = [];
  const addedTasksSet = new Set();
  for (const row of rows) {
    if (addedTasksSet.has(row.task.id)) {
        continue
    }
    
    let rowStatus: TaskCompletionStatus;
    if (row.word_retrieval_session == null) {
      rowStatus = TaskCompletionStatus.NOT_STARTED;
    } else {
      if (row.word_retrieval_session.completedAt != null) {
        rowStatus = TaskCompletionStatus.COMPLETED;
      } else {
        rowStatus = TaskCompletionStatus.IN_PROGRESS;
      }
    }

    if (completionStatusFilter != null && rowStatus != completionStatusFilter) {
      continue;
    }

    if (creatorIsPatientStaff && row.patient_staff == null) {
      continue;
    }

    if (
      (row.task.taskVisibility == "editors_patient_only" &&
        row.patient_staff == null) ||
      row.task.taskVisibility == "unlisted"
    ) {
      continue;
    }

    addedTasksSet.add(row.task.id);
    results.push({
      taskID: row.task.id,
      name: row.task.name,
      author: row.staff.username,
      status: rowStatus,
      createdAt: row.task.createdAt,
      lastSessionAt: row.word_retrieval_session?.startedAt,
      lastCompletedAt: row.word_retrieval_session?.completedAt,
    });
  }

  return results;
}
