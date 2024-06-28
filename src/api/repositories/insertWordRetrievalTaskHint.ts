import { PgEnum, uuid } from "drizzle-orm/pg-core";
import { db } from "src/db";
import { 
    wordRetrievalTask,
    wordRetrievalTaskHint,
    wordRetrievalHintTypeEnum,
    log,
    task
 } from "src/schema";

export default async function insertWordRetrevialTaskHint(
    id: number,
    taskID: string,
    content: string,
    hierarchyNum: number,
    type: "message" | "option_select" // Provide the type argument here
) {
    const newHint = {
        id,
        taskID,
        content,
        hierarchyNum,
        type
    }
    await db.insert(wordRetrievalTaskHint).values(newHint);
}