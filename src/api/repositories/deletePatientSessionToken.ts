import { db } from "src/db"
import { patientSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default function deletePatientSessionToken(patientID: string, token: string) {
    return db.delete(patientSessionToken).where(and(eq(patientSessionToken.patientID, patientID), eq(patientSessionToken.token, token)));
}