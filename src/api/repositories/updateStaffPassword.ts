import { db } from "src/db";
import { staff } from "src/schema";
import { eq } from "drizzle-orm"

export default async function updateStaffPassword(username: string, hashedNewPassword: string) {
    await db.update(staff)
            .set({ hashedPassword: hashedNewPassword })
            .where(eq(staff.username, username));
}