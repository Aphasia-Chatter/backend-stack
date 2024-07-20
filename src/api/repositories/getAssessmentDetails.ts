import { db } from 'src/db';
import { patient, task } from 'src/schema';
import { eq } from 'drizzle-orm';

const getAssessmentDetails = async (patientId: string, taskId: string) => {
  const patientResult = await db.select({ username: patient.username }).from(patient).where(eq(patient.id, patientId)).execute();
  const taskResult = await db.select({ description: task.description }).from(task).where(eq(task.id, taskId)).execute();

  if (patientResult.length === 0 || taskResult.length === 0) {
    throw new Error('Data not found');
  }

  return {
    patientUsername: patientResult[0].username,
    taskDescription: taskResult[0].description,
  };
};

export default getAssessmentDetails;
