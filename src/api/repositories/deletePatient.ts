import { db } from "src/db";
import { patient } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function deletePatient(username: string, hashedPassword: string) {
    await db.delete(patient).where(and(eq(patient.username, username), eq(patient.hashedPassword, hashedPassword)));
}