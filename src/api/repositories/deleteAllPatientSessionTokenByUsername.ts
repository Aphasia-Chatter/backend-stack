import { db } from "src/db"
import { patientSessionToken } from "src/schema"
import { eq } from "drizzle-orm"

export default function deleteAllPatientSessionTokenByUsername(patientID: string) {
    return db.delete(patientSessionToken).where(eq(patientSessionToken.patientID, patientID));
}