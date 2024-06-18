import { db } from "src/db"
import { staffSessionToken } from "src/schema"
import { eq } from "drizzle-orm"

export default async function deleteAllStaffSessionTokenByUsername(staffID: string) {
    await db.delete(staffSessionToken)
        .where(eq(staffSessionToken.staffID, staffID));
}