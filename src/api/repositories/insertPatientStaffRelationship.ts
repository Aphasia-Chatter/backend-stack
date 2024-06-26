import { db } from "src/db";
import { patient_staff, log } from "src/schema";

export default async function insertPatientStaffRelationship(patientID: string, staffID: string) {
    try {
        await db.insert(patient_staff).values({
            patientID: patientID,
            staffID: staffID
        });

    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create a patient staff relationship :: ${err}`,
            severity: "CRITICAL"
        })
    }
}