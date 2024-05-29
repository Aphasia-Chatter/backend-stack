import * as argon2 from "argon2";
import insertStaff from "../repositories/insertStaff";
import selectAllStaff from "../repositories/selectAllStaff";
import insertLog from "../repositories/insertLog";

export default async function createDefaultStaffIfNoneExists() {
    const allStaffs = await selectAllStaff()
    if (allStaffs.length >= 1) {
        return;
    }

    let hashedPassword = ""
    try {
        const defaultStaffPassword = process.env.DEFAULT_STAFF_PASSWORD || 'adminadmin'
        const hashPepper = process.env.HASHING_PEPPER

        hashedPassword = await argon2.hash(defaultStaffPassword + hashPepper);
    } catch (err) {
        await insertLog(`Failed to create default staff user due to hashing issues :: ${err}`, "CRITICAL")
        return;
    }

    const defaultStaffUsername = process.env.DEFAULT_STAFF_USERNAME || 'staff'
    await insertStaff(defaultStaffUsername, hashedPassword)
}