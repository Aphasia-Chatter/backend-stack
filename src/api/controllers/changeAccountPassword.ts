import { Request, Response } from 'express';

import * as argon2 from "argon2";
import updateStaffPassword from '../repositories/updateStaffPassword';
import updatePatientPassword from '../repositories/updatePatientPassword';
import selectStaffByUsernameAndToken from '../repositories/selectStaffByUsernameAndToken';
import selectPatientByUsernameAndToken from '../repositories/selectPatientByUsernameAndToken';
import validateHash from '../utils/validateHash';
import checkPasswordComplexity from '../utils/checkPasswordComplexity';
import deleteAllPatientSessionTokenByUsername from '../repositories/deleteAllPatientSessionTokenByUsername';
import deleteAllStaffSessionTokenByUsername from '../repositories/deleteAllStaffSessionTokenByUsername';

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
    console.log("username:", jsonReq.username)
    console.log("session:", jsonReq.sessionToken)
    console.log("pw:", jsonReq.currentPassword)
    console.log("new pw:", jsonReq.newPassword)
    console.log("new cfm pw:", jsonReq.confirmNewPassword)

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
        await changeStaffAccountPassword(jsonReq as ChangeAccountPasswordRequest, res)
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

// Staff Logout Function
async function changeStaffAccountPassword(jsonReq: ChangeAccountPasswordRequest, res: Response) {
    // Check if staff with session exists
    const result = await selectStaffByUsernameAndToken(jsonReq.username, jsonReq.sessionToken)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_STAFF_ACCOUNT',
            'message': 'User does not exist!'
        }); 
    }

    const relatedStaff = result[0]
    
    try {
        // Check for new password complexity

        // Check for password hash
        if (!(await validateHash(jsonReq.currentPassword, relatedStaff.staff.hashedPassword))) {
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
                await updateStaffPassword(relatedStaff.staff.username, staffHashedNewPassword)
                
                // Clear all staff active sessions
                await deleteAllStaffSessionTokenByUsername(relatedStaff.staff.username)

                return res.status(200).json({
                    'status': 'CHANGE_ACCOUNT_PASSWORD_SUCCESS',
                    'message': 'Staff account password update is successful',
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

// Patient Logout Function
async function changePatientAccountPassword(jsonReq: ChangeAccountPasswordRequest, res: Response) {
    const result = await selectPatientByUsernameAndToken(jsonReq.username, jsonReq.sessionToken)
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
        if (!(await validateHash(jsonReq.currentPassword, relatedPatient.patient.hashedPassword))) {
            return res.status(400).json({
                'status': 'CHANGE_ACCOUNT_PASSWORD_FAILURE',
                'message': 'Incorrect current password! Unable to update patient account password.',
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
                await updatePatientPassword(relatedPatient.patient.username, patientHashedNewPassword)

                // Clear all patient active sessions
                await deleteAllPatientSessionTokenByUsername(relatedPatient.patient.username)

                return res.status(200).json({
                    'status': 'CHANGE_ACCOUNT_PASSWORD_SUCCESS',
                    'message': 'Patient account password update is successful',
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