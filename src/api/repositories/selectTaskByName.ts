import { db } from "src/db"
import { task } from "src/schema"
import { eq } from "drizzle-orm"

export default async function selectTaskByName(name: string) {
    return await db.select().from(task).where(eq(task.name, name))
}