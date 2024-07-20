
import { Request, Response } from 'express';
import fetchAllStaffTokens from '../repositories/fetchAllStaffToken';
import selectStaffByUsername from '../repositories/selectStaffByUsername';
import decryptClientInformation from './decryptClientInformation';
import validateHash from './validateHash';

import utf8Enc from 'crypto-js/enc-utf8';

/**
 * Represents the validation result of a staff request.
 * 
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the request is valid or not.
 * @property {string} status - The status of the validation.
 * @property {string} message - The message associated with the validation status.
 * @property {Object | null} staff - The staff object if the request is valid, otherwise null.
 */
interface ValidationResult {
    isValid: boolean;
    status: string;
    message: string;
    staff: {
        id: string;
        username: string;
        hashedPassword: string;
        hashedToken: string;
    } | null;
}

/**
 * Validates a staff request by checking the session token and user agent.
 *
 * @param {Request} request - The request object containing the session token and user agent.
 * @param {string} userName - The username of the staff member.
 * @return {Promise<ValidationResult>} A promise that resolves to a ValidationResult object indicating the validation status.
 */
export default async function validateStaffRequest(request: Request, userName: string): Promise<ValidationResult> {
    const sessionToken = request.headers['session-token'] as string ?? request.body['sessionToken'] as string ?? request.query['sessionToken'] as string;
    if (!sessionToken.trim()) {
        return {
            isValid: false,
            status: "MISSING_SESSION_TOKEN",
            message: "Session token is missing from request headers",
            staff: null
        };
    }

    if (!userName.trim()) {
        return {
            isValid: false,
            status: "MISSING_USERNAME",
            message: "Username is missing in request",
            staff: null
        };
    }

    const matchedUsers = await selectStaffByUsername(userName);
    if (matchedUsers.length === 0) {
        return {
            isValid: false,
            status: "BAD_USERNAME",
            message: "Username does not exist!",
            staff: null
        };
    }

    const relatedStaff = matchedUsers[0];
    const staffTokens = await fetchAllStaffTokens(relatedStaff.id);

    const clientInfo = request.headers['user-agent'] as string;

    for (const staffToken of staffTokens) {
        if (!await validateHash(sessionToken, staffToken.token)) {
            continue;
        }

        const decryptedClientInfo = decryptClientInformation(staffToken.encryptedClientInformation).toString(utf8Enc);

        if (decryptedClientInfo !== clientInfo) {
            // TODO: Delete session token?
            return {
                isValid: false,
                status: "BAD_SESSION_TOKEN",
                message: "Session token for user does not exist!",
                staff: null
            };
        }

        // TODO: Check token expiration...

        return {
            isValid: true,
            status: "SUCCESS",
            message: "Session token is valid!",
            staff: {
                id: relatedStaff.id,
                username: relatedStaff.username,
                hashedPassword: relatedStaff.hashedPassword,
                hashedToken: staffToken.token
            },
        };
    }

    return {
        isValid: false,
        status: "BAD_SESSION_TOKEN",
        message: "Session token for user does not exist!",
        staff: null
    };
}
