import { Request, Response } from 'express';

import selectStaffByUsernameAndToken from '../../repositories/selectStaffByUsernameAndToken';
import insertEnrolmentCode from 'src/api/repositories/insertEnrolmentCode';
import selectPatientByUsername from 'src/api/repositories/selectPatientByUsername';
import selectEnrolmentCodeByUsername from 'src/api/repositories/selectEnrolmentCodeByUsername';
import generateRandomString from 'src/api/utils/generateRandomString';

interface CreateEnrolmentCodeRequest {
    username: string;
    sessionToken: string;
    patientDesiredUsername: string;
}

export default async function createEnrolmentCode(req: Request, res: Response) {
    const jsonReq = req.body as Partial<CreateEnrolmentCodeRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.patientDesiredUsername) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'desired username is missing in the request body field.',
            'data': {}
        });
    }

    const result = await selectStaffByUsernameAndToken(jsonReq.username, jsonReq.sessionToken)

    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }

    const relatedUser = result[0]

    try {
        // Check if there is an existing patient account with the username
        const result2 = await selectPatientByUsername(jsonReq.patientDesiredUsername)
        if (result2.length > 0) {
            return res.status(400).json({
                'status': 'BAD_USERNAME',
                'message': 'Username already exist. Please change into another username!',
                'data': {}
            }); 
        }

        let randomCode = '';

        // Check if an enrolment code already exist for the desired username
        const result = await selectEnrolmentCodeByUsername(jsonReq.patientDesiredUsername)
        if (result.length > 0) {
            return res.status(400).json({
                'status': 'BAD_USERNAME',
                'message': 'Username already exist. Please choose another username!',
                'data': {}
            }); 
        } else {
            // If not exist, generate a random code for the username
            randomCode = generateRandomString();
            await insertEnrolmentCode(relatedUser.staff.id, jsonReq.patientDesiredUsername, randomCode)
            return res.status(200).json({
                'status': 'SUCCESS',
                'message': `A new enrolment code is created for patient ${jsonReq.patientDesiredUsername}. The code is ${randomCode}`,
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