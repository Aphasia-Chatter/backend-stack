import { Request, Response } from 'express';

import * as argon2 from "argon2";
import updateStaffPassword from '../../../repositories/updateStaffPassword';
import updatePatientPassword from '../../../repositories/updatePatientPassword';
import selectPatientByUsername from '../../../repositories/selectPatientByUsernameAndToken';
import validateHash from '../../../utils/validateHash';
import deleteAllPatientSessionToken from '../../../repositories/deleteAllPatientSessionToken';
import deleteAllStaffSessionToken from '../../../repositories/deleteAllStaffSessionToken';
import getStaffPassword from '../../../repositories/getStaffPassword';

export enum ChangeAccountPasswordType {
    STAFF,
    PATIENT
}

interface ChangeAccountPasswordRequest {
    staffUsername: string;
    sessionToken: string;
    patientUsername: string;
    newPatientPassword: string,
    patientConfirmPassword: string,
    staffPassword: string,
}

export default async function changeAccountPassword(req: Request, res: Response, changeAccountPasswordType: ChangeAccountPasswordType) {
    const jsonReq = req.body as Partial<ChangeAccountPasswordRequest>;
    console.log("Staff Username:", jsonReq.staffUsername)
    console.log("session:", jsonReq.sessionToken)
    console.log("Patient Username:", jsonReq.patientUsername)
    console.log("New Pw:", jsonReq.newPatientPassword)
    console.log("Staff PW:", jsonReq.staffPassword)

    if (!jsonReq.staffUsername) {
        return res.status(400).json({
            'status': 'MISSING_STAFF_USERNAME',
            'message': 'staff username is missing in the request body field.'
        });
    }

    if (!jsonReq.sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session is missing in the request body field.'
        });
    }

    if (!jsonReq.patientUsername) {
        return res.status(400).json({
            'status': 'MISSING_CURRENT_PASSWORD',
            'message': 'patient username is missing in the request body field.'
        });
    }

    if (!jsonReq.newPatientPassword) {
        return res.status(400).json({
            'status': 'MISSING_NEW_PASSWORD',
            'message': 'new password is missing in the request body field.'
        });
    }

    if (!jsonReq.staffPassword) {
        return res.status(400).json({
            'status': 'MISSING_CONFIRM_NEW_PASSWORD',
            'message': 'staff password is missing in the request body field.'
        });
    }

    if (jsonReq.newPatientPassword != jsonReq.patientConfirmPassword) {
        return res.status(400).json({
            'status': 'MISMATCH_NEW_PASSWORD',
            'message': 'New Password and confirm new password in the request body fields do not match.',
            'data': {}
        });
    }

    // try {
        
    //     // Retrieve the hashed staff password from the database
    //     const staffHashedPassword = await getStaffPassword(jsonReq.staffUsername);

    //     // Verify the entered staff password matches the stored hashed password
    //     const isStaffPasswordValid = await argon2.verify(staffHashedPassword, jsonReq.staffPassword);

    //     if (!isStaffPasswordValid) {
    //         return res.status(400).json({
    //             'status': 'INVALID_STAFF_PASSWORD',
    //             'message': 'Staff password is incorrect.'
    //         });
    //     }

    //     // Continue with patient account password change process
    //     await changePatientAccountPassword(jsonReq as ChangeAccountPasswordRequest, res);
    // } catch (error) {
    //     console.error('Error:', error);
    //     return res.status(500).json({
    //         'status': 'SERVER_ERROR',
    //         'message': 'An error occurred while processing the request.',
    //     });
    // }

    await changePatientAccountPassword(jsonReq as ChangeAccountPasswordRequest, res);

}


// Patient Change Account Password Function
async function changePatientAccountPassword(jsonReq: ChangeAccountPasswordRequest, res: Response) {
    const result = await selectPatientByUsername(jsonReq.patientUsername, jsonReq.sessionToken)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_PATIENT_ACCOUNT',
            'message': 'User does not exist!'
        });
    }

    const relatedPatient = result[0]

    try {
        let patientHashedNewPassword = ""
        try {
            // Hash the new password
            const patientNewPassword = jsonReq.newPatientPassword
            const hashPepper = process.env.HASHING_PEPPER
            patientHashedNewPassword = await argon2.hash(patientNewPassword + hashPepper);
            console.log("Patient Hashed New Password:", patientHashedNewPassword)

            // Update patient password with new password
            await updatePatientPassword(relatedPatient.username, patientHashedNewPassword)

            console.log("Patient Password Updated!")

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
    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
        });
    }
}