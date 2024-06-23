import { Request, Response } from 'express';

import selectStaffByUsernameAndToken from '../../repositories/selectStaffByUsernameAndToken';
import fetchAllEnrolmentCodeByStaffID from '../../repositories/fetchAllEnrolmentByStaffID'

interface GetAllEnrolmentCodeRequest {
    username: string;
    sessionToken: string;
}

export default async function getAllEnrolmentCodes(req: Request, res: Response) {
    const jsonReq = req.body as Partial<GetAllEnrolmentCodeRequest>;
    const { username, sessionToken } = req.query;

    console.log("username:", username)
    console.log("session:", sessionToken)

    if (!username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.',
            'data': {}
        });
    }
    
    const result = await selectStaffByUsernameAndToken(username.toString(), sessionToken.toString())

    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }

    const relatedUser = result[0]

    try {
        const enrollmentCodes = await fetchAllEnrolmentCodeByStaffID(relatedUser.staff.id);
        if (enrollmentCodes.length > 0) {
            // A list of enrolment code found
            return res.status(200).json({
                'status': 'SUCCESS',
                'message': 'Successfully retrieved enrollment codes!',
                'data': {
                    enrollmentCodes: enrollmentCodes
                }
            });
        }
        else { 
            // No enrolment code found
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No enrolment code found. Create one!',
                'data': {}
            }); 
        }
    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}