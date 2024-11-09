import { Request, Response } from 'express';

import * as argon2 from "argon2";
import updatePatientPassword from '../../../repositories/updatePatientPassword';
import selectPatientByUsername from '../../../repositories/selectPatientByUsername';
import validateHash from '../../../utils/validateHash';
import deleteAllPatientSessionToken from '../../../repositories/deleteAllPatientSessionToken';
import selectStaffByUsername from 'src/api/repositories/selectStaffByUsername';

export enum ResetPatientAccountPasswordType {
    STAFF
}

interface ResetPatientAccountPasswordRequest {
    staffUsername: string;
    sessionToken: string;
    patientUsername: string;
    newPatientPassword: string,
    patientConfirmPassword: string,
    staffPassword: string,
}

export default async function changeAccountPassword(req: Request, res: Response) {
    const jsonReq = req.body as Partial<ResetPatientAccountPasswordRequest>;
    console.log("Staff Username:", jsonReq.staffUsername)
    console.log("session:", jsonReq.sessionToken)
    console.log("Patient Username:", jsonReq.patientUsername)
    console.log("New Pw:", jsonReq.newPatientPassword)
    console.log("Staff PW:", jsonReq.staffPassword)

    if (!jsonReq.staffUsername) {
        return res.status(400).json({
            'status': 'MISSING STAFF USERNAME',
            'message': 'staff username is missing in the request body field.'
        });
    }

    if (!jsonReq.sessionToken) {
        return res.status(400).json({
            'status': 'MISSING SESSION',
            'message': 'session is missing in the request body field.'
        });
    }

    if (!jsonReq.patientUsername) {
        return res.status(400).json({
            'status': 'MISSING CURRENT PASSWORD',
            'message': 'patient username is missing in the request body field.'
        });
    }

    if (!jsonReq.newPatientPassword) {
        return res.status(400).json({
            'status': 'MISSING NEW PASSWORD',
            'message': 'new password is missing in the request body field.'
        });
    }

    if (!jsonReq.staffPassword) {
        return res.status(400).json({
            'status': 'MISSING CONFIRM NEW PASSWORD',
            'message': 'staff password is missing in the request body field.'
        });
    }

    if (jsonReq.newPatientPassword != jsonReq.patientConfirmPassword) {
        return res.status(400).json({
            'status': 'MISMATCHED PASSWORD',
            'message': 'New Password and confirm new password in the request body fields do not match.',
            'data': {}
        });
    }   

    try {
        const result = await selectStaffByUsername(jsonReq.staffUsername)

        const relatedUser = result[0]
        
        // added await because validateHash is a background task
        if (!(await validateHash(jsonReq.staffPassword, relatedUser.hashedPassword))) {
            return res.status(400).json({
                'status': 'WRONG STAFF PASSWORD',
                'message': 'Hashed Password mismatch!',
                'data': {}
            });
        }

        // Continue with patient account password change process
        await resetPatientAccountPassword(jsonReq as ResetPatientAccountPasswordRequest, res);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'An error occurred while processing the request.',
        });
    }

}

// Patient Change Account Password Function
async function resetPatientAccountPassword(jsonReq: ResetPatientAccountPasswordRequest, res: Response) {
    const result = await selectPatientByUsername(jsonReq.patientUsername)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD PATIENT ACCOUNT',
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
                'status': 'SUCCESS',
                'message': 'Patient account password update is successful.',
            });
        } catch (err) {
            return res.status(400).json({
                'status': 'HASHING ERROR',
                'message': 'Failed to update patient account new password due to hashing issues.'
            });
        }
    } catch (err) {
        return res.status(500).json({
            'status': 'SERVER ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
        });
    }
}