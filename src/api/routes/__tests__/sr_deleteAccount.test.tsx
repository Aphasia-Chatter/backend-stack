import request from 'supertest';
import express from 'express';
import deleteAccount, {DeleteAccountType} from '../../../api/controllers/deleteAccount';
import validateStaffRequest from '../../../api/utils/validateStaffRequest';
import validateHash from '../../../api/utils/validateHash';
import deleteStaff from '../../../api/repositories/deleteStaff';

jest.mock('../../../api/utils/validateStaffRequest');
jest.mock('../../../api/utils/validateHash');
jest.mock('../../../api/repositories/deleteStaff');

// Create an Express app instance
const app = express();
app.use(express.json());

app.post('/api/staff/delete-account', async (req, res) => {
    deleteAccount(req, res, DeleteAccountType.STAFF)
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
});

describe('POST /api/staff/delete-account', () => {

    it('should return 400 if username is missing', async () => {
        const response = await request(app)
            .post('/api/staff/delete-account')
            .send({ sessionToken: 'testSessionToken', password: 'testPassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
    });

    it('should return 400 if sessionToken is missing', async () => {
        const response = await request(app)
            .post('/api/staff/delete-account')
            .send({ username: 'testUser', password: 'testPassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_SESSION');
    });

    it('should return 400 if password is missing', async () => {
        const response = await request(app)
            .post('/api/staff/delete-account')
            .send({ username: 'testUser', sessionToken: 'testSessionToken' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_PASSWORD');
    });

    it('should return 400 if password is incorrect', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({
            isValid: true,
            staff: { username: 'staffuser', hashedPassword: 'p@ssw0rd' }
        });
        (validateHash as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
            .post('/api/staff/delete-account')
            .send({ username: 'staffuser', sessionToken: 'testSessionToken', password: 'wrongpassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('DELETE_ACCOUNT_FAILURE');
        expect(response.body.message).toBe('Incorrect password! Unable to delete staff account.');
    });

    it('should return 200 on successful account deletion', async () => {
        (validateStaffRequest as jest.Mock).mockResolvedValue({
            isValid: true,
            staff: { username: 'staffuser', hashedPassword: 'p@ssw0rd' }
        });
        (validateHash as jest.Mock).mockResolvedValue(true);
        (deleteStaff as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .post('/api/staff/delete-account')
            .send({ username: 'staffuser', sessionToken: 'testSessionToken', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('DELETE_ACCOUNT_SUCCESS');
        expect(response.body.message).toBe('Patient deletion is successful. You will be logged out now.');
    });

});
