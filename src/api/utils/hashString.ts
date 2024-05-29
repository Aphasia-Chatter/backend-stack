import insertLog from "../repositories/insertLog";
import * as argon2 from "argon2";

export default async function hashString(input: string) {
    const hashPepper = process.env.HASHING_PEPPER || ""
    if (hashPepper == undefined) {
        await insertLog("Hashing pepper is not set!", "WARNING")
    }

    try {
        return await argon2.hash(input + hashPepper);
    } catch (err) {
        await insertLog(`Failed to perform hashing :: ${err}`, "ERROR")
        throw err;
    }
}