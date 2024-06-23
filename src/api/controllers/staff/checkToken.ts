import { Request, Response } from 'express';
import selectStaffByUsername from '../../repositories/selectStaffByUsername';
import fetchAllStaffTokens from '../../repositories/fetchAllStaffToken';
import validateHash from '../../utils/validateHash';
import decryptClientInformation from '../../utils/decryptClientInformation';

import utf8Enc from 'crypto-js/enc-utf8';

export default async function checkToken(req: Request, res: Response){
    const sessionToken = req.headers['session-token'] as string;
    if (!sessionToken) {
        return res.status(401).json({
            'status': "MISSING_SESSION_TOKEN",
            'message': "Session token (session-token) is missing from request headers",
            'data': {}
        });
    }

    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({
        'status': "MISSING_USERNAME",
        'message': "Missing username in query parameter",
        'data': {}
    });
    }

    const matchingUsers = await selectStaffByUsername(username);
    if (matchingUsers.length <= 0) {
        return res.status(400).json({
            'status': "BAD_USERNAME",
            'message': "Username does not exist!",
            'data': {}
        });
    }

    const relatedStaff = matchingUsers[0];
    const allStaffTokens = await fetchAllStaffTokens(relatedStaff.id)

    const clientInfo = req.headers['user-agent'] as string;
    for (let i = 0; i < allStaffTokens.length; i++) {
        const staffToken = allStaffTokens[i];
        if (!await validateHash(sessionToken, staffToken.token)) {
            continue
        }

        const toCompare = decryptClientInformation(staffToken.encryptedClientInformation).toString(utf8Enc)

        if (toCompare != clientInfo) {
            // TODO: Delete session token, maybe comproised?
            // TODO: Log this action
            return res.status(401).json({
                'status': "BAD_SESSION_TOKEN",
                'message': "Session token for user does not exist!",
                'data': {}
            });
        }

        return res.status(200).json({
            'status': "SUCCESS",
            'message': "Session token is valid!",
            'data': {}
        });
    }

    return res.status(401).json({
        'status': "BAD_SESSION_TOKEN",
        'message': "Session token for user does not exist!",
        'data': {}
    });
}
