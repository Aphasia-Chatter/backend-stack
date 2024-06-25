import { Request, Response } from 'express';

import deleteStaff from '../repositories/deleteStaff';
import deletePatient from '../repositories/deletePatient';
import selectPatientByUsernameAndToken from '../repositories/selectPatientByUsernameAndToken';
import validateHash from '../utils/validateHash';
import validateStaffRequest from '../utils/validateStaffRequest';


export enum DeleteAccountType {
    STAFF,
    PATIENT
}

interface DeleteAccountRequest {
    username: string;
    sessionToken: string;
    password:  string;
}

export default async function deleteAccount(req: Request, res: Response, deleteAccountType: DeleteAccountType) {
    const jsonReq = req.body as Partial<DeleteAccountRequest>;
    console.log("username:", jsonReq.username)
    console.log("session:", jsonReq.sessionToken)
    console.log("pw:", jsonReq.password)

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

    if (!jsonReq.password) {
        return res.status(400).json({
            'status': 'MISSING_PASSWORD',
            'message': 'password is missing in the request body field.',
            'data': {}
        }); 
    }

    if (deleteAccountType == DeleteAccountType.STAFF) {
        await deleteAccountStaff(jsonReq as DeleteAccountRequest, req, res)
    }
    else if (deleteAccountType == DeleteAccountType.PATIENT) {
        await deleteAccountPatient(jsonReq as DeleteAccountRequest, res)
    }
    else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!'
        });
    }
}

// Staff Delete Account Function
async function deleteAccountStaff(jsonReq: DeleteAccountRequest, req: Request, res: Response) {
    // Check if staff with session exists
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
        // Check for password hash
        if (!(await validateHash(jsonReq.password, relatedUser.hashedPassword))) {
            return res.status(400).json({
                'status': 'DELETE_ACCOUNT_FAILURE',
                'message': 'Incorrect password! Unable to delete staff account.',
                'data': {}
            }); 
        }
        else {
            await deleteStaff(relatedUser.username, relatedUser.hashedPassword)

            return res.status(200).json({
                'status': 'DELETE_ACCOUNT_SUCCESS',
                'message': 'Patient deletion is successful. You will be logged out now.',
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

// Patient Delete Account Function
async function deleteAccountPatient(jsonReq: DeleteAccountRequest, res: Response) {
    const result = await selectPatientByUsernameAndToken(jsonReq.username, jsonReq.sessionToken)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_PATIENT_ACCOUNT',
            'message': 'User does not exist!'
        }); 
    }

    const relatedPatient = result[0]
    
    try {
        // Check for password hash
        if (!(await validateHash(jsonReq.password, relatedPatient.patient.hashedPassword))) {
            return res.status(400).json({
                'status': 'DELETE_ACCOUNT_FAILURE',
                'message': 'Incorrect password! Unable to delete staff account.',
                'data': {}
            }); 
        }
        else {
            await deletePatient(relatedPatient.patient.username, relatedPatient.patient.hashedPassword)
            
            return res.status(200).json({
                'status': 'DELETE_ACCOUNT_SUCCESS',
                'message': 'Patient deletion is successful. You will be logged out now.',
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