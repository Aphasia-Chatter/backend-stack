import request from 'supertest';
import express from 'express';
import ResetPatientAccountPassword, {ResetPatientAccountPasswordType} from '../../../api/controllers/staff/resetPassword/resetPatientAccountPassword';
import selectStaffByUsername from '../../../api/repositories/selectStaffByUsername';
import validateHash from '../../utils/validateHash';
import updatePatientPassword from '../../../api/repositories/updatePatientPassword';
import deleteAllPatientSessionToken from '../../../api/repositories/deleteAllPatientSessionToken';

// Mock external dependencies
jest.mock('../../../api/repositories/selectStaffByUsername', () => 
    jest.fn().mockResolvedValue([{ hashedPassword: 'hashedPassword123' }])
);

jest.mock('../../utils/validateHash', () => 
    jest.fn().mockResolvedValue(true)
);
jest.mock('../../../api/repositories/updatePatientPassword');
jest.mock('../../../api/repositories/deleteAllPatientSessionToken');

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.post('/api/staff/reset-patient-account-password', async (req, res) => {
    ResetPatientAccountPassword(req, res)
});


describe('POST /api/staff/reset-patient-account-password', () => {
    const baseUrl = '/api/staff/reset-patient-account-password';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if staffUsername is missing', async () => {
        const response = await request(app)
            .post(baseUrl)
            .send({ sessionToken: 'testSessionToken', patientUsername: 'patient1', newPatientPassword: 'newPass', patientConfirmPassword: 'newPass', staffPassword: 'staffPass' });
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING STAFF USERNAME');
    });

    it('should return 400 if sessionToken is missing', async () => {
        const response = await request(app)
            .post(baseUrl)
            .send({ staffUsername: 'staff1', patientUsername: 'patient1', newPatientPassword: 'newPass', patientConfirmPassword: 'newPass', staffPassword: 'staffPass' });
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING SESSION');
    });

    it('should return 400 if patient passwords do not match', async () => {
        const response = await request(app)
            .post(baseUrl)
            .send({
                staffUsername: 'staff1',
                sessionToken: 'testSessionToken',
                patientUsername: 'patient1',
                newPatientPassword: 'newPass',
                patientConfirmPassword: 'differentPass',
                staffPassword: 'staffPass'
            });
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISMATCHED PASSWORD');
    });

    it('should return 400 if staff password is incorrect', async () => {
        (selectStaffByUsername as jest.Mock).mockResolvedValue([{ username: 'staff1', hashedPassword: 'hashedStaffPass' }]);
        (validateHash as jest.Mock).mockResolvedValue(false); // Mock password validation failure

        const response = await request(app)
            .post(baseUrl)
            .send({
                staffUsername: 'staff1',
                sessionToken: 'testSessionToken',
                patientUsername: 'patient1',
                newPatientPassword: 'newPass',
                patientConfirmPassword: 'newPass',
                staffPassword: 'wrongStaffPass'
            });
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('WRONG STAFF PASSWORD');
    });

});