import request from 'supertest';
import express from 'express';
import getAllEnrolmentCodes from '../../../api/controllers/staff/enrollment/getAllEnrolmentCodes';

// Mock dependencies
jest.mock('../../../api/utils/validateStaffRequest');
jest.mock('../../../api/repositories/fetchAllEnrolmentByStaffID');

// Import mocked functions
import validateStaffRequest from '../../../api/utils/validateStaffRequest';
import fetchAllEnrolmentByStaffID  from '../../../api/repositories/fetchAllEnrolmentByStaffID';

const app = express();
app.use(express.json());
app.get('/api/staff/get-all-enrolment-codes', getAllEnrolmentCodes);

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
});

describe('GET /api/staff/get-all-enrolment-codes', () => {

    it('should return 400 if username is missing', async () => {
        const response = await request(app)
            .get('/api/staff/get-all-enrolment-codes')
            .query({ sessionToken: 'validSession' }); // Missing username

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('username is missing in the request body field.');
    });

    it('should return 400 if sessionToken is missing', async () => {
        const response = await request(app)
            .get('/api/staff/get-all-enrolment-codes')
            .query({ username: 'staff1' }); // Missing sessionToken

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_SESSION');
        expect(response.body.message).toBe('session is missing in the request body field.');
    });

    it('should return 401 if staff validation fails', async () => {
        // Mock the return value for validateStaffRequest
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: false, status: 'INVALID', message: 'Invalid staff' });

        const response = await request(app)
            .get('/api/staff/get-all-enrolment-codes')
            .query({ username: 'staff1', sessionToken: 'validSession' });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('INVALID');
        expect(response.body.message).toBe('Invalid staff');
    });

    it('should return 200 and enrollment codes when successful', async () => {
        // Mock the functions to return data
        const mockEnrollmentCodes = ['ENROLLMENT_CODE_1', 'ENROLLMENT_CODE_2'];
        (validateStaffRequest as jest.Mock).mockResolvedValue({ isValid: true, staff: { id: 'staff1' } });
        (fetchAllEnrolmentByStaffID as jest.Mock).mockResolvedValue(mockEnrollmentCodes);

        const response = await request(app)
            .get('/api/staff/get-all-enrolment-codes')
            .query({ username: 'staff1', sessionToken: 'validSession' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('SUCCESS');
        expect(response.body.message).toBe('Successfully retrieved enrollment codes!');
        expect(response.body.data.enrollmentCodes).toEqual(mockEnrollmentCodes);
    });

});
