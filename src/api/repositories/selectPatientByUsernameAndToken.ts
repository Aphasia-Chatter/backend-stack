import { db } from "src/db"
import { patient, patientSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function selectPatientByUsername(username: string, token: string) {
    return await db.select()
        .from(patient)
}