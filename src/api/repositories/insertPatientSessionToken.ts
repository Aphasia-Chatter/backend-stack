import { db } from "src/db"
import { patientSessionToken } from "src/schema"

export default function insertPatientSessionToken(
    hashedToken: string,
    patientID: string,
    encryptedClientInfo: string
) {
    return db.insert(patientSessionToken).values({
        token: hashedToken,
        patientID: patientID,
        encryptedClientInformation: encryptedClientInfo,
        expiryDate: null
    })
}