import { db } from "src/db"
import { staffSessionToken } from "src/schema"
import { eq } from "drizzle-orm"

export default function deleteAllStaffSessionTokenByUsername(staffID: string) {
    return db.delete(staffSessionToken).where(eq(staffSessionToken.staffID, staffID));
}