import AES from "crypto-js/aes"
import insertLog from "../repositories/insertLog"

export default function decryptClientInformation(encryptedClientInformation: string) {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (encryptionKey == undefined) {
        insertLog("Encryption key is not set in ENV!", "ERROR").then(() => {})
        throw Error("Encryption key is not set!")
    }

    const result = AES.decrypt(encryptedClientInformation, encryptionKey)

    if (result == undefined) {
        insertLog("Failed to do encryption", "ERROR").then(() => {})
        throw Error("Failed to do AES encryption!")
    }

    return result
}