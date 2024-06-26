import { Request, Response } from 'express';

import selectStaffByUsernameAndToken from '../../repositories/selectStaffByUsernameAndToken';
import fetchAllRelatedPatientByStaffID from '../../repositories/fetchAllRelatedPatientByStaffID'


interface GetAllRelatedPatientsRequest {
    username: string;
    sessionToken: string;
}

export default async function getAllRelatedPatients(req: Request, res: Response) {
    const jsonReq = req.body as Partial<GetAllRelatedPatientsRequest>;
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
        console.log("Related Staff ID", relatedUser.staff.id)
        const relatedPatients = await fetchAllRelatedPatientByStaffID(relatedUser.staff.id);

        if (relatedPatients) {
            // A list of related patients found
            console.log("HEE", relatedPatients)
            return res.status(200).json({
                'status': 'SUCCESS',
                'message': 'Successfully retrieved related patients!',
                'data': {
                    relatedPatients: relatedPatients
                }
            });
        }
        else { 
            // No related patient found
            return res.status(400).json({
                'status': 'FAILED',
                'message': ' No patient found!',
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