import { Request, Response } from 'express';

import deleteEnrolmentCode from 'src/api/repositories/deleteEnrolmentCode';
import selectEnrolmentCodeByUsernameAndCode from 'src/api/repositories/selectEnrolmentCodeByUsernameAndCode';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';

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

    const validationResult = await validateStaffRequest(req, jsonReq.username)

    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        })
    }

    const relatedUser = validationResult.staff!

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
            await deleteEnrolmentCode(relatedUser.id, jsonReq.selectedPatientDesiredUsername, jsonReq.selectedPatientEnrolmentCode)
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