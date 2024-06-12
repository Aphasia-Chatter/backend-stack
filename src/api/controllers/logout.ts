import { Request, Response } from 'express';

import deleteStaffSessionToken from '../repositories/deleteStaffSessionToken';
import deletePatientSessionToken from '../repositories/deletePatientSessionToken';
import selectStaffByUsername from '../repositories/selectStaffByUsername';
import selectPatientByUsername from '../repositories/selectPatientByUsername';

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
        await logoutStaff(jsonReq as LogoutRequest, res)
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
async function logoutStaff(jsonReq: LogoutRequest, res: Response) {
    const result = await selectStaffByUsername(jsonReq.username)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }
    const relatedUser = result[0]

    try {    
        await deleteStaffSessionToken(relatedUser.id, jsonReq.sessionToken)
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
    const result = await selectPatientByUsername(jsonReq.username)
    console.log("Hello::: ", result.length)

    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }

    const relatedUser = result[0]

    try {    
        await deletePatientSessionToken(relatedUser.id, jsonReq.sessionToken)
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