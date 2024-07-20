import { Request, Response } from 'express';

import deleteStaffSessionToken from '../repositories/deleteStaffSessionToken';
import deletePatientSessionToken from '../repositories/deletePatientSessionToken';
import selectPatientByUsernameAndToken from '../repositories/selectPatientByUsernameAndToken';
import validateStaffRequest from '../utils/validateStaffRequest';

export enum LogoutType {
    STAFF,
    PATIENT
}

interface LogoutRequest {
    username: string;
    sessionToken: string;
}

export default async function logout(req: Request, res: Response, logoutType: LogoutType) {
    const jsonReq = req.body as Partial<LogoutRequest>;

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

    if (logoutType == LogoutType.STAFF) {
        await logoutStaff(jsonReq as LogoutRequest, req, res)
    }
    else if (logoutType == LogoutType.PATIENT) {
        await logoutPatient(jsonReq as LogoutRequest, res)
    }
    else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!',
            'data': {}
        });
    }
}

// Staff Logout Function
async function logoutStaff(jsonReq: LogoutRequest, req: Request, res: Response) {
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
        await deleteStaffSessionToken(relatedUser.id, relatedUser.hashedToken)
        
        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'Staff Logout successful, deleted the session token!',
        }); 
      } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}

// Patient Logout Function
async function logoutPatient(jsonReq: LogoutRequest, res: Response) {
    const result = await selectPatientByUsernameAndToken(jsonReq.username, jsonReq.sessionToken)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }

    const relatedUser = result[0]

    try {    
        await deletePatientSessionToken(relatedUser.patient.id, relatedUser.patient_session_token.token)

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'Patient Logout successful, deleted the session token!',
        }); 
      } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}