import { db } from "src/db";
import { staffSessionToken } from "src/schema";
import { eq } from "drizzle-orm";

export default async function fetchAllStaffTokens(staffID: string) {
    return await db.select()
        .from(staffSessionToken)
        .where(eq(staffSessionToken.staffID, staffID))
}