import { db } from "src/db";
import { enrollmentCode } from "src/schema";
import { eq } from "drizzle-orm";

export default async function fetchAllStaffTokens(staffID: string) {
    return await db.select().from(enrollmentCode).where(eq(enrollmentCode.staffID, staffID))
}