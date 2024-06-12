import { db } from "src/db"
import { staffSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default function deleteStaffSessionToken(staffID: string, token: string) {
    return db.delete(staffSessionToken).where(and(eq(staffSessionToken.staffID, staffID), eq(staffSessionToken.token, token)));
}