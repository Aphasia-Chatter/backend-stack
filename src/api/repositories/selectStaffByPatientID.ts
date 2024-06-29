import { db } from "src/db"
import { staff, patient_staff } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectStaffByPatientId(patientID: string) {
    return await db.select()
        .from(staff)
        .innerJoin(patient_staff, eq(patient_staff.staffID, staff.id))
        .where(eq(patient_staff.patientID, patientID))
}