import { db } from "src/db"
import { patient } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectPatientByUsername(username: string) {
    // db.select().from(patient).where(like(patient.username, "%llo wor%"));
    return await db.select().from(patient).where(eq(patient.username, username))
}