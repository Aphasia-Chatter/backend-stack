import { db } from "src/db";
import { patient } from "src/schema";
import { eq } from "drizzle-orm"

export default async function updatePatientPassword(username: string, hashedNewPassword: string) {
    await db.update(patient)
        .set({ hashedPassword: hashedNewPassword })
        .where(eq(patient.username, username));
}