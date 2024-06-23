import { db } from "src/db"
import { patientSessionToken } from "src/schema"
import { eq } from "drizzle-orm"

export default async function deleteAllPatientSessionTokenByUsername(patientID: string) {
    await db.delete(patientSessionToken)
        .where(eq(patientSessionToken.patientID, patientID));
}