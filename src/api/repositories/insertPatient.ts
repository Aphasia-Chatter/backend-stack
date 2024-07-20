import { db } from "src/db";
import { patient, log } from "src/schema";

export default async function insertPatient(username: string, hashedPassword: string) {
    try {
        await db.insert(patient).values({
            username: username,
            hashedPassword: hashedPassword
        });

    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create a patient user :: ${err}`,
            severity: "CRITICAL"
        })
    }
}