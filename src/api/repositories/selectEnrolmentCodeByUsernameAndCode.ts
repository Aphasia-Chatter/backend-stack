import { db } from "src/db";
import { enrollmentCode } from "src/schema";
import { eq, and } from "drizzle-orm";

export default async function selectEnrolmentCodeByUsername(patientUsername: string, enrolmentCode: string) {
    return await db.select()
        .from(enrollmentCode)
        .where(and(eq(enrollmentCode.patientUsername , patientUsername), eq(enrollmentCode.code, enrolmentCode)))
}