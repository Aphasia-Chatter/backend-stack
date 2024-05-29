import { db } from "src/db"
import { staff } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectStaffByUsername(username: string) {
    return await db.select().from(staff).where(eq(staff.username, username))
}