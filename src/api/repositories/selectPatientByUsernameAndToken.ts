import { db } from "src/db"
import { patient, patientSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function selectPatientByUsernameAndToken(username: string, token: string) {
    return await db.select()
        .from(patient)
        .innerJoin(patientSessionToken, eq(patient.id, patientSessionToken.patientID))
        .where(and(eq(patient.username, username), eq(patientSessionToken.token, token)))
}