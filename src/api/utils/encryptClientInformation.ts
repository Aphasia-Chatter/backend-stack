import AES from "crypto-js/aes"
import insertLog from "../repositories/insertLog"

export default function encryptClientInformation(clientInformation: string) {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (encryptionKey == undefined) {
        insertLog("Encryption key is not set in ENV!", "ERROR").then(() => {})
        throw Error("Encryption key is not set!")
    }

    const result = AES.encrypt(clientInformation, encryptionKey)

    if (result == undefined) {
        insertLog("Failed to do encryption", "ERROR").then(() => {})
        throw Error("Failed to do AES encryption!")
    }

    return result
}