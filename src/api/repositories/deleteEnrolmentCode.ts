import { db } from "src/db";
import { enrollmentCode } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function deleteEnrolmentCode(staffID: string, patientDesiredUsername: string, enrolmentCode: string) {
    await db.delete(enrollmentCode)
        .where(and(eq(enrollmentCode.staffID, staffID),eq(enrollmentCode.patientUsername, patientDesiredUsername), eq(enrollmentCode.code, enrolmentCode)));
}