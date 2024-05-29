import { db } from "src/db"
import { staffSessionToken } from "src/schema"

export default function insertStaffSessionToken(
    hashedToken: string,
    staffID: string,
    encryptedClientInfo: string
) {
    return db.insert(staffSessionToken).values({
        token: hashedToken,
        staffID: staffID,
        encryptedClientInformation: encryptedClientInfo,
        expiryDate: null
    })
}