import { db } from "src/db";
import { patient_staff, patient } from "src/schema";
import { eq } from "drizzle-orm";

export default async function fetchAllRelatedPatientsByStaffID(staffID: string) {
    try {
        const results = await db.select()
            .from(patient)
            .innerJoin(patient_staff, eq(patient.id, patient_staff.patientID))
            .where(eq(patient_staff.staffID, staffID))
            .execute(); // Executes the query and returns the results

        return results.map((record: any) => ({
            username: record.patient.username,
            enrolledAt: record.patient.enrolledAt,
        }));
    } catch (error) {
        console.error("Error fetching related patients by staff ID:", error);
        throw new Error("Could not fetch related patients");
    }
}