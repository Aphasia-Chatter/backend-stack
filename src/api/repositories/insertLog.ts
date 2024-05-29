import { db } from "src/db";
import { log } from "src/schema";

export default function insertLog(
    message: string, 
    severity: "INFO" | "DEBUG" | "VERBOSE" | "WARNING" | "ERROR" | "CRITICAL" = "INFO") {
    return db.insert(log).values({
        message: message,
        severity: severity
    })
}