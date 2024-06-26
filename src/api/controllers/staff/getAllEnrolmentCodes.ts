import { Request, Response } from 'express';

import fetchAllEnrolmentCodeByStaffID from '../../repositories/fetchAllEnrolmentByStaffID'
import validateStaffRequest from 'src/api/utils/validateStaffRequest';

interface GetAllEnrolmentCodeRequest {
    username: string;
    sessionToken: string;
}

export default async function getAllEnrolmentCodes(req: Request, res: Response) {
    const jsonReq = req.body as Partial<GetAllEnrolmentCodeRequest>;
    const { username, sessionToken } = req.query;

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
   
    const validationResult = await validateStaffRequest(req, username.toString())
    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        })
    }

    const relatedUser = validationResult.staff!

    try {
        const enrollmentCodes = await fetchAllEnrolmentCodeByStaffID(relatedUser.id);

        if (enrollmentCodes) {
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