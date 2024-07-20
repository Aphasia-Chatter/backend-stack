import { db } from "src/db";
import { patientSessionToken } from "src/schema";
import { eq } from "drizzle-orm";

export default async function fetchAllPatientToken(patientID: string) {
    return await db.select()
        .from(patientSessionToken)
        .where(eq(patientSessionToken.patientID, patientID))
}