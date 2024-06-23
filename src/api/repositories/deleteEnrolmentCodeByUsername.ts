import { db } from "src/db";
import { enrollmentCode } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function deleteEnrolmentCodeByUsername(patientDesiredUsername: string, enrolmentCode: string) {
    await db.delete(enrollmentCode)
        .where(and(eq(enrollmentCode.patientUsername, patientDesiredUsername), eq(enrollmentCode.code, enrolmentCode)));
}