import { db } from "src/db";
import { staff } from "src/schema";

export default async function selectAllStaff() {
    return await db.select().from(staff)
}