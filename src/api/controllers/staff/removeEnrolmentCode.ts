import { Request, Response } from 'express';

import selectStaffByUsernameAndToken from '../../repositories/selectStaffByUsernameAndToken';
import deleteEnrolmentCode from 'src/api/repositories/deleteEnrolmentCode';
import selectEnrolmentCodeByUsernameAndCode from 'src/api/repositories/selectEnrolmentCodeByUsernameAndCode';

interface RemoveEnrolmentCodeRequest {
    username: string;
    sessionToken: string;
    selectedPatientDesiredUsername: string;
    selectedPatientEnrolmentCode: string;
}

export default async function removeEnrolmentCode(req: Request, res: Response) {
    const jsonReq = req.body as Partial<RemoveEnrolmentCodeRequest>;

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

    if (!jsonReq.selectedPatientDesiredUsername) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'desired username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.selectedPatientEnrolmentCode) {
        return res.status(400).json({
            'status': 'MISSING_ENROLMENT_CODE',
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
        // Check if an enrolment code already exist for the desired username
        const result2 = await selectEnrolmentCodeByUsernameAndCode(jsonReq.selectedPatientDesiredUsername, jsonReq.selectedPatientEnrolmentCode)
        if (result2.length == 0) {
            return res.status(400).json({
                'status': 'BAD_USERNAME',
                'message': 'Please check that enrolment code for the user exist.',
                'data': {}
            });

        } else {
            await deleteEnrolmentCode(relatedUser.staff.id, jsonReq.selectedPatientDesiredUsername, jsonReq.selectedPatientEnrolmentCode)
            return res.status(200).json({
                'status': 'SUCCESS',
                'message': 'The code has been successfully deleted for the user.',
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