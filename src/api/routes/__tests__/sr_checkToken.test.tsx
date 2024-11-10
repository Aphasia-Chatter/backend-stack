import request from 'supertest';
import express from 'express';
import checkToken from '../../../api/controllers/staff/checkToken';
import selectStaffByUsername from '../../../api/repositories/selectStaffByUsername';
import fetchAllStaffTokens from '../../../api/repositories/fetchAllStaffToken';
import validateHash from '../../../api/utils/validateHash';
import decryptClientInformation from '../../../api/utils/decryptClientInformation';

// Mock the dependencies
jest.mock('../../../api/repositories/selectStaffByUsername');
jest.mock('../../../api/repositories/fetchAllStaffToken');
jest.mock('../../../api/utils/validateHash');
jest.mock('../../../api/utils/decryptClientInformation');

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/validate-token', checkToken);

describe('GET /api/staff/validate-token', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 for a valid session token', async () => {
    const username = 'staff123';
    const sessionToken = 'valid_token';
    const staffId = 1;
    const encryptedClientInfo = 'encrypted_info';
    const clientInfo = 'test-client-info';

    // Mock database results
    (selectStaffByUsername as jest.Mock).mockResolvedValue([{ id: staffId }]);
    (fetchAllStaffTokens as jest.Mock).mockResolvedValue([{ token: 'hashed_token', encryptedClientInformation: encryptedClientInfo }]);
    (validateHash as jest.Mock).mockResolvedValue(true);
    (decryptClientInformation as jest.Mock).mockReturnValueOnce(clientInfo);

    const response = await request(app)
      .get('/api/staff/validate-token')
      .set('session-token', sessionToken)
      .set('user-agent', clientInfo)
      .query({ username });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'SUCCESS', message: 'Session token is valid!', data: {} });
  });

  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .get('/api/staff/validate-token')
      .set('session-token', 'some_token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: 'MISSING_USERNAME', message: 'Missing username in query parameter', data: {} });
  });

  it('should return 401 if session token is missing', async () => {
    const response = await request(app)
      .get('/api/staff/validate-token')
      .query({ username: 'staff123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ status: 'MISSING_SESSION_TOKEN', message: 'Session token (session-token) is missing from request headers', data: {} });
  });

  it('should return 400 for a non-existing username', async () => {
    (selectStaffByUsername as jest.Mock).mockResolvedValue([]);
    const response = await request(app)
      .get('/api/staff/validate-token')
      .set('session-token', 'some_token')
      .query({ username: 'unknown_user' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: 'BAD_USERNAME', message: 'Username does not exist!', data: {} });
  });

  it('should return 401 for an invalid session token', async () => {
    const username = 'staff123';
    const sessionToken = 'invalid_token';
    const staffId = 1;
    const clientInfo = 'test-client-info';

    // Mock database results
    (selectStaffByUsername as jest.Mock).mockResolvedValue([{ id: staffId }]);
    (fetchAllStaffTokens as jest.Mock).mockResolvedValue([{ token: 'another_hashed_token', encryptedClientInformation: 'encrypted_info' }]);
    (validateHash as jest.Mock).mockResolvedValue(false); // Token does not match

    const response = await request(app)
      .get('/api/staff/validate-token')
      .set('session-token', sessionToken)
      .set('user-agent', clientInfo)
      .query({ username });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ status: 'BAD_SESSION_TOKEN', message: 'Session token for user does not exist!', data: {} });
  });
});
