import { Request, Response } from 'express';

import * as argon2 from "argon2";
import updateStaffPassword from '../repositories/updateStaffPassword';
import updatePatientPassword from '../repositories/updatePatientPassword';
import selectPatientByUsername from '../repositories/selectPatientByUsername';
import validateHash from '../utils/validateHash';
import deleteAllPatientSessionToken from '../repositories/deleteAllPatientSessionToken';
import deleteAllStaffSessionToken from '../repositories/deleteAllStaffSessionToken';
import validateStaffRequest from '../utils/validateStaffRequest';

export enum ChangeAccountPasswordType {
    STAFF,
    PATIENT
}

interface ChangeAccountPasswordRequest {
    username: string;
    sessionToken: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export default async function changeAccountPassword(req: Request, res: Response, changeAccountPasswordType: ChangeAccountPasswordType) {
    const jsonReq = req.body as Partial<ChangeAccountPasswordRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.'
        });
    }

    if (!jsonReq.sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.'
        });
    }

    if (!jsonReq.currentPassword) {
        return res.status(400).json({
            'status': 'MISSING_CURRENT_PASSWORD',
            'message': 'password is missing in the request body field.'
        });
    }

    if (!jsonReq.newPassword) {
        return res.status(400).json({
            'status': 'MISSING_NEW_PASSWORD',
            'message': 'password is missing in the request body field.'
        });
    }

    if (!jsonReq.confirmNewPassword) {
        return res.status(400).json({
            'status': 'MISSING_CONFIRM_NEW_PASSWORD',
            'message': 'password is missing in the request body field.'
        }); 
    }

    if (jsonReq.newPassword != jsonReq.confirmNewPassword) {
        return res.status(400).json({
            'status': 'MISMATCH_NEW_PASSWORD',
            'message': 'New Password and confirm new password in the request body fields do not match.',
            'data': {}
        }); 
    }

    if (changeAccountPasswordType == ChangeAccountPasswordType.STAFF) {
        await changeStaffAccountPassword(jsonReq as ChangeAccountPasswordRequest, req, res)
    }
    else if (changeAccountPasswordType == ChangeAccountPasswordType.PATIENT) {
        await changePatientAccountPassword(jsonReq as ChangeAccountPasswordRequest, res)
    }
    else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!'
        });
    }
}

// Change Staff Account Password Function
async function changeStaffAccountPassword(jsonReq: ChangeAccountPasswordRequest,req: Request, res: Response) {
    // Check if staff with session exists
    const validationResult = await validateStaffRequest(req, jsonReq.username)
    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        })
    }

    const relatedStaff = validationResult.staff!

    try {
        // Check for new password complexity

        // Check for password hash
        if (!(await validateHash(jsonReq.currentPassword, relatedStaff.hashedPassword))) {
            return res.status(400).json({
                'status': 'CHANGE_ACCOUNT_PASSWORD_FAILURE',
                'message': 'Incorrect password! Unable to update staff account password.',
            }); 
        }
        else {
            let staffHashedNewPassword = ""
            
            try {
                // Hash the new password
                const staffNewPassword = jsonReq.confirmNewPassword
                const hashPepper = process.env.HASHING_PEPPER
                staffHashedNewPassword = await argon2.hash(staffNewPassword + hashPepper);

                // Update staff password with new password
                await updateStaffPassword(relatedStaff.username, staffHashedNewPassword)
                
                // Clear all staff active sessions
                await deleteAllStaffSessionToken(relatedStaff.id)

                return res.status(200).json({
                    'status': 'CHANGE_ACCOUNT_PASSWORD_SUCCESS',
                    'message': 'Staff account password update is successful. You will be logged out now.',
                });
                
            } catch (err) {
                return res.status(400).json({
                    'status': 'HASHING_ERROR',
                    'message': 'Failed to update staff account new password due to hashing issues.'
                }); 
            }
        }
      } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
        });
    }
}

// Change Patient Account Password Function
async function changePatientAccountPassword(jsonReq: ChangeAccountPasswordRequest, res: Response) {
    const result = await selectPatientByUsername(jsonReq.username)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_PATIENT_ACCOUNT',
            'message': 'User does not exist!'
        }); 
    }

    const relatedPatient = result[0]
    
    try {
        // Check for new password complexity

        // Check for password hash
        if (!(await validateHash(jsonReq.currentPassword, relatedPatient.hashedPassword))) {
            return res.status(400).json({
                'status': 'CHANGE_ACCOUNT_PASSWORD_FAILURE',
                'message': 'Incorrect password! Unable to update patient account password.',
            }); 
        }
        else {
            let patientHashedNewPassword = ""
            
            try {
                // Hash the new password
                const patientNewPassword = jsonReq.confirmNewPassword
                const hashPepper = process.env.HASHING_PEPPER
                patientHashedNewPassword = await argon2.hash(patientNewPassword + hashPepper);

                // Update patient password with new password
                await updatePatientPassword(relatedPatient.username, patientHashedNewPassword)

                // Clear all patient active sessions
                await deleteAllPatientSessionToken(relatedPatient.id)

                return res.status(200).json({
                    'status': 'CHANGE_ACCOUNT_PASSWORD_SUCCESS',
                    'message': 'Patient account password update is successful. You will be logged out now.',
                }); 
            } catch (err) {
                return res.status(400).json({
                    'status': 'HASHING_ERROR',
                    'message': 'Failed to update patient account new password due to hashing issues.'
                }); 
            }
        }
      } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
        });
    }
}