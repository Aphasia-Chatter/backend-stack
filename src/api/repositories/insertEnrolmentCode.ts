import { db } from "src/db";
import { enrollmentCode, log } from "src/schema";

export default async function insertEnrolmentCode(staffID: string, patientDesiredUsername: string, enrolmentCode: string) {
    try {
        await db.insert(enrollmentCode).values({
            staffID: staffID,
            patientUsername: patientDesiredUsername,
            code: enrolmentCode
        });

    } catch (err) {
        await db.insert(log).values({
            message: `Failed to create default staff user :: ${err}`,
            severity: "CRITICAL"
        })
    }
}