import { db } from "src/db"
import { staff, staffSessionToken } from "src/schema"
import { eq, and } from "drizzle-orm"

export default async function selectStaffByUsernameAndToken(username: string, token: string) {
    return await db.select()
                    .from(staff)
                    .innerJoin(staffSessionToken, eq(staff.id, staffSessionToken.staffID))
                    .where(and(eq(staff.username, username), eq(staffSessionToken.token, token)))
}