import { db } from "src/db"
import { patientSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function deletePatientSessionToken(patientID: string, token: string) {
    await db.delete(patientSessionToken)
        .where(and(eq(patientSessionToken.patientID, patientID), eq(patientSessionToken.token, token)));
}