import request from 'supertest';
import express from 'express';
import register, { RegisterType } from '../../../api/controllers/register';
import selectStaffByUsername from '../../../api/repositories/selectStaffByUsername';
import insertStaff from '../../../api/repositories/insertStaff';
import selectPatientByUsername from '../../../api/repositories/selectPatientByUsername';
import selectEnrolmentCodeByUsernameAndCode from '../../../api/repositories/selectEnrolmentCodeByUsernameAndCode';
import insertPatient from '../../../api/repositories/insertPatient';
import deleteEnrolmentCodeByUsername from '../../../api/repositories/deleteEnrolmentCodeByUsername';
import insertPatientStaffRelationship from '../../../api/repositories/insertPatientStaffRelationship';
import * as argon2 from 'argon2';

// Mock dependencies
jest.mock('../../../api/repositories/selectStaffByUsername');
jest.mock('../../../api/repositories/insertStaff');
jest.mock('../../../api/repositories/selectPatientByUsername');
jest.mock('../../../api/repositories/selectEnrolmentCodeByUsernameAndCode');
jest.mock('../../../api/repositories/insertPatient');
jest.mock('../../../api/repositories/deleteEnrolmentCodeByUsername');
jest.mock('../../../api/repositories/insertPatientStaffRelationship');
jest.mock('argon2', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

// Set up Express app
const app = express();
app.use(express.json());

app.post('/api/staff/register', async (req, res) => {
    await register(req, res, RegisterType.STAFF);
});

app.post('/api/patient/register', async (req, res) => {
    await register(req, res, RegisterType.PATIENT);
});

describe('POST /api/staff/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if username is missing', async () => {
        const response = await request(app).post('/api/staff/register').send({
            password: 'password123',
            confirmPassword: 'password123',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
    });

    it('should return 400 if password is missing', async () => {
        const response = await request(app).post('/api/staff/register').send({
            username: 'testuser',
            confirmPassword: 'password123',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_PASSWORD');
    });

    it('should return 400 if confirmPassword is missing', async () => {
        const response = await request(app).post('/api/staff/register').send({
            username: 'testuser',
            password: 'password123',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_CONFIRM_PASSWORD');
    });

    it('should return 400 if password and confirmPassword do not match', async () => {
        const response = await request(app).post('/api/staff/register').send({
            username: 'testuser',
            password: 'password123',
            confirmPassword: 'password321',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISMATCH_PASSWORD');
    });

    it('should return 400 if username already exists', async () => {
        // Mocking the scenario where the username already exists
        (selectStaffByUsername as jest.Mock).mockResolvedValueOnce([{ id: 1 }]);
        const response = await request(app).post('/api/staff/register').send({
            username: 'existinguser',
            password: 'password123',
            confirmPassword: 'password123',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_USERNAME');
    });

    it('should return 201 and register a new staff if username is available', async () => {
        // Mocking the scenario where the username is available and staff registration proceeds
        (selectStaffByUsername as jest.Mock).mockResolvedValueOnce([]);
        (argon2.hash as jest.Mock).mockResolvedValue('hashedPassword');
        (insertStaff as jest.Mock).mockResolvedValueOnce(null);

        const response = await request(app).post('/api/staff/register').send({
            username: 'newstaff',
            password: 'password123',
            confirmPassword: 'password123',
        });
        expect(response.status).toBe(201);
        expect(response.body.status).toBe('REGISTRATION SUCCESS');
    });
});

describe('POST /api/patient/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if enrolmentCode is missing for patient registration', async () => {
        const response = await request(app).post('/api/patient/register').send({
            username: 'newpatient',
            password: 'password123',
            confirmPassword: 'password123',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_ENROLMENT_CODE');
    });

    it('should return 400 if username and enrolmentCode do not match', async () => {
        // Mocking scenarios for patient registration failure
        (selectPatientByUsername as jest.Mock).mockResolvedValueOnce([]);
        (selectEnrolmentCodeByUsernameAndCode as jest.Mock).mockResolvedValueOnce([]);

        const response = await request(app).post('/api/patient/register').send({
            username: 'newpatient',
            password: 'password123',
            confirmPassword: 'password123',
            enrolmentCode: 'invalidCode',
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_USERNAME_AND_CODE');
    });

});
