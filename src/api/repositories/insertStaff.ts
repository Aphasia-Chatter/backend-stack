import { db } from "src/db";
import { staff, log } from "src/schema";

export default async function insertStaff(username: string, hashedPassword: string) {
    try {
        await db.insert(staff).values({
            username: username,
            hashedPassword: hashedPassword
        });

    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create default staff user :: ${err}`,
            severity: "CRITICAL"
        })
    }
}