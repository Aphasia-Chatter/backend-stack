import { db } from "src/db"
import { patient } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectPatientByUsername(username: string) {
    return await db.select().from(patient).where(eq(patient.username, username))
}