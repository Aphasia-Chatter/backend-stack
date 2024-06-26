import { db } from "src/db"
import { patient_staff } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function deletePatientStaffRelationshipByPatientID(patientID: string) {
    await db.delete(patient_staff)
        .where(and(eq(patient_staff.patientID, patientID)));
}