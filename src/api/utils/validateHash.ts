import insertLog from "../repositories/insertLog"
import * as argon2 from "argon2";

export default async function validateHash(input: string, compare: string) {
    const hashPepper = process.env.HASHING_PEPPER || ""
    if (hashPepper == undefined) {
        await insertLog("Hashing pepper is not set!", "WARNING")
    }

    try {
        return await argon2.verify(compare, input + hashPepper)
    } catch (err) {
        await insertLog(`Failed to perform hashing verification :: ${err}`, "ERROR")
        throw err;
    }
}