import { Request, Response } from 'express';

import * as argon2 from "argon2";
import insertStaff from "../repositories/insertStaff";
import insertPatient from "../repositories/insertPatient";
import selectStaffByUsername from '../repositories/selectStaffByUsername';
import selectPatientByUsername from '../repositories/selectPatientByUsername';
import selectEnrolmentCodeByUsernameAndCode from '../repositories/selectEnrolmentCodeByUsernameAndCode';
import insertLog from '../repositories/insertLog';
import deleteEnrolmentCodeByUsername from '../repositories/deleteEnrolmentCodeByUsername';
import insertPatientStaffRelationship from '../repositories/insertPatientStaffRelationship';

export enum RegisterType {
    STAFF,
    PATIENT
}

interface RegisterRequest {
    username: string;
    password: string;
    confirmPassword: string;
    enrolmentCode: string;
}

export default async function register(req: Request, res: Response, registerType: RegisterType) {
    const jsonReq = req.body as Partial<RegisterRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'Username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.password) {
        return res.status(400).json({
            'status': 'MISSING_PASSWORD',
            'message': 'Password is missing in the request body field.',
            'data': {}
        }); 
    }

    if (!jsonReq.confirmPassword) {
        return res.status(400).json({
            'status': 'MISSING_CONFIRM_PASSWORD',
            'message': 'Confirm password is missing in the request body field.',
            'data': {}
        }); 
    }

    if (jsonReq.password != jsonReq.confirmPassword) {
        return res.status(400).json({
            'status': 'MISMATCH_PASSWORD',
            'message': 'Password and confirm password in the request body fields do not match.',
            'data': {}
        }); 
    }

    if (registerType == RegisterType.STAFF) {
        await registerStaff(jsonReq as RegisterRequest, res)
    }

    else if (registerType == RegisterType.PATIENT) {
        if (!jsonReq.enrolmentCode) {
            return res.status(400).json({
                'status': 'MISSING_ENROLMENT_CODE',
                'message': 'Enrolment code is missing in the request body field.',
                'data': {}
            }); 
        }

        await registerPatient(jsonReq as RegisterRequest, res)
    }
    
    else {
        return res.status(501).json({
            'status': 'NOT_IMPLEMENTED',
            'message': 'This is yet TODO!',
            'data': {}
        });
    }
}

async function registerStaff(jsonReq: RegisterRequest, res: Response) {
    // Check if there is an existing staff account with the username
    const result = await selectStaffByUsername(jsonReq.username)
    if (result.length > 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'Username already exist. Cannot register staff user!',
            'data': {}
        }); 
    }
    
    // Username does not exist. Able to register for a staff account
    else {
        // Hash and pepper staff password
        let hashedPassword = ""
        try {
            const staffPassword = jsonReq.confirmPassword
            const hashPepper = process.env.HASHING_PEPPER
            hashedPassword = await argon2.hash(staffPassword + hashPepper);
        } catch (err) {
            await insertLog(`Failed to create staff user due to hashing issues :: ${err}`, "CRITICAL")
            return res.status(400).json({
                'status': 'HASHING_ERROR',
                'message': 'Failed to create patient user due to hashing issues.'
            }); 
        }

        // Create staff account in the database
        const staffUsername = jsonReq.username
        await insertStaff(staffUsername, hashedPassword)
        return res.status(201).json({
            status: 'REGISTRATION SUCCESS',
            message: 'Staff account registered successfully',
          });
    }
}

async function registerPatient(jsonReq: RegisterRequest, res: Response) {
    // Check if there is an existing patient account with the username
    const result = await selectPatientByUsername(jsonReq.username)
    if (result.length > 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'Username already exist. Cannot register patient user!',
            'data': {}
        }); 
    }

    // Check if the username and code is valid
    const result2 = await selectEnrolmentCodeByUsernameAndCode(jsonReq.username, jsonReq.enrolmentCode)
    if (result2.length == 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME_AND_CODE',
            'message': 'Please check that your username and enrolment code is correct.',
            'data': {}
        }); 
    }
    
    // Username does not exist and enrolment exist. Able to register for a patient account
    // Hash and pepper patient password
    let hashedPassword = ""
    try {
        const patientPassword = jsonReq.confirmPassword
        const hashPepper = process.env.HASHING_PEPPER
        hashedPassword = await argon2.hash(patientPassword + hashPepper);

        // Create patient account in the database
        const patientUsername = jsonReq.username
        await insertPatient(patientUsername, hashedPassword)

        // Delete the enrolment code from the database after patient registration (either this or set status is Used or sth)
        await deleteEnrolmentCodeByUsername(patientUsername, jsonReq.enrolmentCode)

        // Establish relationship between the staff who created the enrolment code and the registered patient
        const result3 = await selectPatientByUsername(patientUsername)
        const relatedPatientUser = result3[0]
        const relatedStaffUser = result2[0]
        await insertPatientStaffRelationship(relatedPatientUser.id, relatedStaffUser.staffID)

        return res.status(201).json({
            status: 'REGISTRATION SUCCESS',
            message: 'Patient account registered successfully',
            });

    } catch (err) {
        await insertLog(`Failed to create patient user due to hashing issues :: ${err}`, "CRITICAL")
        return res.status(400).json({
            'status': 'HASHING_ERROR',
            'message': 'Failed to create patient user due to hashing issues.'
        }); 
    }
}