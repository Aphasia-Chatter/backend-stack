import request from 'supertest';
import express from 'express';
import removeEnrolmentCode from '../../../api/controllers/staff/enrollment/removeEnrolmentCode';

// Mocking the required dependencies
jest.mock('../../../api/repositories/selectEnrolmentCodeByUsernameAndCode');
jest.mock('../../../api/repositories/deleteEnrolmentCode');
jest.mock('../../../api/utils/validateStaffRequest');

const selectEnrolmentCodeByUsernameAndCode = require('../../../api/repositories/selectEnrolmentCodeByUsernameAndCode');
const deleteEnrolmentCode = require('../../../api/repositories/deleteEnrolmentCode');
const validateStaffRequest = require('../../../api/utils/validateStaffRequest');

// Set up the express app
const app = express();
app.use(express.json());
app.post('/api/staff/remove-existing-enrolment-code', removeEnrolmentCode);

describe('POST /api/staff/remove-existing-enrolment-code', () => {
    let mockReqBody: any;

    beforeEach(() => {
        mockReqBody = {
            username: 'staffUser',
            sessionToken: 'validSessionToken',
            selectedPatientDesiredUsername: 'patient123',
            selectedPatientEnrolmentCode: 'enrolCode123',
        };
    });

    it('should return 400 if username is missing', async () => {
        mockReqBody.username = undefined; // Remove the username

        const response = await request(app).post('/api/staff/remove-existing-enrolment-code').send(mockReqBody);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('username is missing in the request body field.');
    });

    it('should return 400 if sessionToken is missing', async () => {
        mockReqBody.sessionToken = undefined; // Remove the sessionToken

        const response = await request(app).post('/api/staff/remove-existing-enrolment-code').send(mockReqBody);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_SESSION');
        expect(response.body.message).toBe('session is missing in the request body field.');
    });

    it('should return 400 if patient desired username is missing', async () => {
        mockReqBody.selectedPatientDesiredUsername = undefined; // Remove the desired username

        const response = await request(app).post('/api/staff/remove-existing-enrolment-code').send(mockReqBody);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('desired username is missing in the request body field.');
    });

    it('should return 400 if enrolment code is missing', async () => {
        mockReqBody.selectedPatientEnrolmentCode = undefined; // Remove the enrolment code

        const response = await request(app).post('/api/staff/remove-existing-enrolment-code').send(mockReqBody);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_ENROLMENT_CODE');
        expect(response.body.message).toBe('desired username is missing in the request body field.');
    });


});
