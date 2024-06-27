import { db } from "src/db"
import { patient, patient_staff } from "src/schema"
import { ilike, eq, and } from "drizzle-orm";

export default async function selectPatientByLIKE(query: string) {
    const queryWithWildcard = `${query}%`;
    const result = await db.select()
        .from(patient)
        .innerJoin(patient_staff, eq(patient.id, patient_staff.patientID))
        .where(and(ilike(patient.username, queryWithWildcard)));

    return result.map((record: any) => ({
        username: record.patient.username,
        enrolledAt: record.patient.enrolledAt,
    }));
}