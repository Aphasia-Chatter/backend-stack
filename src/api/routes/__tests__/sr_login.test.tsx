import request from 'supertest';
import express from 'express';
import login, { LoginType } from '../../../api/controllers/login';
import selectStaffByUsername from '../../../api/repositories/selectStaffByUsername';
import validateHash from '../../../api/utils/validateHash';
import generateSessionToken from '../../../api/utils/generateSessionToken';
import encryptClientInformation from '../../../api/utils/encryptClientInformation';
import hashString from '../../../api/utils/hashString';
import insertStaffSessionToken from '../../../api/repositories/insertStaffSessionToken';

jest.mock('../../../api/repositories/selectStaffByUsername');
jest.mock('../../../api/utils/validateHash');
jest.mock('../../../api/utils/generateSessionToken');
jest.mock('../../../api/utils/encryptClientInformation');
jest.mock('../../../api/utils/hashString');
jest.mock('../../../api/repositories/insertStaffSessionToken');

const app = express();
app.use(express.json());

app.post('/api/staff/login', async (req, res) => {
    await login(req, res, LoginType.STAFF);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('POST /api/staff/login', () => {

    it('should login successfully with valid credentials', async () => {
        (selectStaffByUsername as jest.Mock).mockResolvedValueOnce([{ id: 1, hashedPassword: 'hashedPassword' }]);
        (validateHash as jest.Mock).mockResolvedValueOnce(true);
        (generateSessionToken as jest.Mock).mockReturnValue('mockedToken');
        (encryptClientInformation as jest.Mock).mockReturnValue('encryptedClientInfo');
        (hashString as jest.Mock).mockResolvedValueOnce('hashedToken');
        (insertStaffSessionToken as jest.Mock).mockResolvedValueOnce(null);

        const response = await request(app)
            .post('/api/staff/login')
            .send({ username: 'testuser', password: 'testpassword' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('SUCCESS');
        expect(response.body.data.sessionToken).toBe('mockedToken');
    });

    it('should return 400 error if username is missing', async () => {
        const response = await request(app)
            .post('/api/staff/login')
            .send({ password: 'testpassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('username is missing in the request body field.');
    });

    it('should return 400 error if password is missing', async () => {
        const response = await request(app)
            .post('/api/staff/login')
            .send({ username: 'testuser' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_PASSWORD');
        expect(response.body.message).toBe('password is missing in the request body field.');
    });

    it('should return 400 error if username does not exist', async () => {
        (selectStaffByUsername as jest.Mock).mockResolvedValueOnce([]);

        const response = await request(app)
            .post('/api/staff/login')
            .send({ username: 'nonexistentuser', password: 'testpassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_USERNAME');
        expect(response.body.message).toBe('User does not exist!');
    });

    it('should return 400 error if password is incorrect', async () => {
        (selectStaffByUsername as jest.Mock).mockResolvedValueOnce([{ id: 1, hashedPassword: 'hashedPassword' }]);
        (validateHash as jest.Mock).mockResolvedValueOnce(false);

        const response = await request(app)
            .post('/api/staff/login')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('BAD_PASSWORD');
        expect(response.body.message).toBe('Password mismatch!');
    });
});
