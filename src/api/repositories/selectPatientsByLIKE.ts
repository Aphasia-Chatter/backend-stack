import { db } from "src/db"
import { patient, patient_staff, staff } from "src/schema"
import { ilike, eq, and } from "drizzle-orm";

import { Request, Response } from 'express';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';

interface SearchPatientsRequest {
    username: string;
    sessionToken: string;
    query: string;
}

export default async function selectPatientsByLIKE(req: Request, res: Response, query: string) {

    const { username, sessionToken } = req.query as Partial<SearchPatientsRequest>;

    console.log("username:", username);
    console.log("sessionToken:", sessionToken);

    if (!username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request query.',
            'data': {}
        });
    }
    
    if (!sessionToken) {
        return res.status(400).json({
            'status': 'MISSING_SESSION',
            'message': 'session token is missing in the request query.',
            'data': {}
        });
    }

    const validationResult = await validateStaffRequest(req, username.toString());
    console.log('validationResult:', validationResult);
    if (!validationResult.isValid) {
        return res.status(401).json({
            'status': validationResult.status,
            'message': validationResult.message,
            'data': {}
        });
    }

    // const relatedUser = validationResult.staff;
    // if (!relatedUser) {
    //     return res.status(401).json({
    //         'status': 'INVALID_USER',
    //         'message': 'The related user could not be found.',
    //         'data': {}
    //     });
    // }

    // console.log('relatedUser:', relatedUser);

    try {
        // Fetch staffID based on username from the staff table
        const staffRecord = await db.select().from(staff).where(eq(staff.username, username)).limit(1);
        if (!staffRecord) {
            return res.status(401).json({
                'status': 'INVALID_USER',
                'message': 'The related staff user could not be found.',
                'data': {}
            });
        }

        const staffID = staffRecord[0].id;

        console.log('Staff ID:', staffID);

        // Filter patients by staffID and search query
        const queryWithWildcard = `${query}%`;
        const result = await db.select()
            .from(patient)
            .innerJoin(patient_staff, eq(patient.id, patient_staff.patientID))
            .where(
                and(
                    ilike(patient.username, queryWithWildcard),
                    eq(patient_staff.staffID, staffID) // Use the retrieved staffID here
                )
            );

        if (result.length === 0) {
            return res.json({
                status: 'NO_PATIENT_FOUND',
                message: 'No patient found.',
                data: {}
            });
        }

        // Return the filtered results
        return res.json(result.map((record: any) => ({
            username: record.patient.username,
            enrolledAt: record.patient.enrolledAt,
            id: record.patient.id
        })));
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        });
    }


    
}