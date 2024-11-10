import request from 'supertest';
import express from 'express';
import createEnrolmentCode from '../../../api/controllers/staff/enrollment/createEnrolmentCode';

// Mock dependencies
jest.mock('../../../api/utils/validateStaffRequest');
jest.mock('../../../api/repositories/selectPatientByUsername');
jest.mock('../../../api/repositories/selectEnrolmentCodeByUsername');
jest.mock('../../../api/repositories/insertEnrolmentCode');
jest.mock('../../../api/utils/generateRandomString');

// Import mocked functions
import validateStaffRequest from '../../../api/utils/validateStaffRequest';
import selectPatientByUsername from '../../../api/repositories/selectPatientByUsername';
import selectEnrolmentCodeByUsername from '../../../api/repositories/selectEnrolmentCodeByUsername';
import insertEnrolmentCode from '../../../api/repositories/insertEnrolmentCode';
import generateRandomString from '../../../api/utils/generateRandomString';

const app = express();
app.use(express.json());
app.post('/api/staff/create-enrolment-code', createEnrolmentCode);

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
});

describe('POST /api/staff/create-enrolment-code', () => {

    it('should return 400 if username is missing', async () => {
        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('username is missing in the request body field.');
    });

    it('should return 400 if sessionToken is missing', async () => {
        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_SESSION');
        expect(response.body.message).toBe('session is missing in the request body field.');
    });

    it('should return 400 if patientDesiredUsername is missing', async () => {
        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('desired username is missing in the request body field.');
    });

    it('should return 401 if staff validation fails', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: false, status: 'INVALID', message: 'Invalid staff' });

        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('INVALID');
        expect(response.body.message).toBe('Invalid staff');
    });

    it('should return 400 if patient username already exists', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: true, staff: { id: 'staff1' } });
        (selectPatientByUsername as jest.Mock).mockResolvedValue([{}]); // Simulating that the patient username exists

        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_USERNAME');
        expect(response.body.message).toBe('Username already exist. Please change into another username!');
    });

    it('should return 400 if enrolment code already exists for the username', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: true, staff: { id: 'staff1' } });
        (selectPatientByUsername as jest.Mock).mockResolvedValue([]);
        (selectEnrolmentCodeByUsername as jest.Mock).mockResolvedValue([{}]); // Simulating that an enrolment code already exists

        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_USERNAME');
        expect(response.body.message).toBe('Username already exist. Please choose another username!');
    });

    it('should return 200 if enrolment code is created successfully', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: true, staff: { id: 'staff1' } });
        (selectPatientByUsername as jest.Mock).mockResolvedValue([]);
        (selectEnrolmentCodeByUsername as jest.Mock).mockResolvedValue([]);
        (generateRandomString as jest.Mock).mockReturnValue('randomCode123');
        (insertEnrolmentCode as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('SUCCESS');
        expect(response.body.message).toContain('A new enrolment code is created for patient patient1');
    });

    it('should return 500 if there is a server error', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: true, staff: { id: 'staff1' } });
        (selectPatientByUsername as jest.Mock).mockResolvedValue([]);
        (selectEnrolmentCodeByUsername as jest.Mock).mockResolvedValue([]);
        (insertEnrolmentCode as jest.Mock).mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/api/staff/create-enrolment-code')
            .send({ username: 'staff1', sessionToken: 'validSession', patientDesiredUsername: 'patient1' });

        expect(response.status).toBe(500);
        expect(response.body.status).toBe('SERVER_ERROR');
        expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
    });

});
