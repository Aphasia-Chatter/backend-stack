import { Request, Response } from 'express';

import generateSessionToken from '../utils/generateSessionToken';
import encryptClientInformation from '../utils/encryptClientInformation';
import hashString from '../utils/hashString';
import insertStaffSessionToken from '../repositories/insertStaffSessionToken';
import insertPatientSessionToken from '../repositories/insertPatientSessionToken';
import validateHash from '../utils/validateHash';
import selectStaffByUsername from '../repositories/selectStaffByUsername';
import selectPatientByUsername from '../repositories/selectPatientByUsername';
import insertLog from '../repositories/insertLog';

export enum LoginType {
    STAFF,
    PATIENT,
    ADMIN
}

interface LoginRequest {
    username: string;
    password: string;
}

export default async function login(req: Request, res: Response, loginType: LoginType) {
    const jsonReq = req.body as Partial<LoginRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.password) {
        return res.status(400).json({
            'status': 'MISSING_PASSWORD',
            'message': 'password is missing in the request body field.',
            'data': {}
        }); 
    }

    if (loginType == LoginType.STAFF) {
        await loginStaff(jsonReq as LoginRequest, req, res)
    } 
    else if (loginType == LoginType.PATIENT) {
        await loginPatient(jsonReq as LoginRequest, req, res)
    }
    else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!',
            'data': {}
        });
    }
}

// Staff Login Function
async function loginStaff(jsonReq: LoginRequest, req: Request, res: Response) {
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
        // added await because validateHash is a background task
        if (!(await validateHash(jsonReq.password, relatedUser.hashedPassword))) {
            return res.status(400).json({
                'status': 'BAD_PASSWORD',
                'message': 'Password mismatch!',
                'data': {}
            }); 
        }

        const generatedToken =  generateSessionToken()
        const clientInfo = req.headers['user-agent'] as string;
        const encryptedClientInfo = encryptClientInformation(clientInfo)
    
        const hashedToken = await hashString(generatedToken)
        await insertStaffSessionToken(hashedToken, relatedUser.id, encryptedClientInfo.toString())

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'Login successful, save the session token inside data!',
            'data': {
                'session_token': generatedToken
            }
        }); 
      } catch (err) {
        await insertLog(`Failed to perform hashing verification :: ${err}`, "ERROR")
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }
}

// Patient Login Function
async function loginPatient(jsonReq: LoginRequest, req: Request, res: Response) {
    const result = await selectPatientByUsername(jsonReq.username)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!'
        }); 
    }
    const relatedUser = result[0]

    try {
        // added await because validateHash is a background task
        if (!(await validateHash(jsonReq.password, relatedUser.hashedPassword))) {
            return res.status(400).json({
                'status': 'BAD_PASSWORD',
                'message': 'Password mismatch!',
            }); 
        }

        const generatedToken =  generateSessionToken()
        const clientInfo = req.headers['user-agent'] as string;
        const encryptedClientInfo = encryptClientInformation(clientInfo)
    
        const hashedToken = await hashString(generatedToken)
        await insertPatientSessionToken(hashedToken, relatedUser.id, encryptedClientInfo.toString())

        return res.status(200).json({
            'status': 'LOGIN_SUCCESS',
            'message': 'Login successful, save the session token inside data!',
            'data': {
                'username': jsonReq.username,
                'session_token': generatedToken
            }
        });
        
      } catch (err) {
        await insertLog(`Failed to perform hashing verification :: ${err}`, "ERROR")
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
        }); 
    }
}