import { db } from "src/db";
import { staff } from "src/schema";
import { eq, and } from "drizzle-orm"

export default async function deleteStaff(username: string, hashedPassword: string) {
    await db.delete(staff).where(and(eq(staff.username, username), eq(staff.hashedPassword, hashedPassword)));
}