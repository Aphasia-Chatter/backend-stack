import request from 'supertest';
import express from 'express';
import getAllRelatedPatients from '../../../api/controllers/staff/getAllRelatedPatients';

// Mock the dependencies
jest.mock('src/api/utils/validateStaffRequest', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../repositories/fetchAllRelatedPatientByStaffID', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Create an Express app instance for testing
const app = express();
app.use(express.json());

// Route setup for testing
app.get('/api/staff/get-all-related-patients', async (req, res) => {
  getAllRelatedPatients(req, res);
});

beforeEach(() => {
  jest.clearAllMocks(); // Clear mocks before each test to ensure isolation
});

describe('GET /api/staff/get-all-related-patients', () => {
  it('should return 400 if username is missing', async () => {
    const response = await request(app).get('/api/staff/get-all-related-patients?sessionToken=validToken');
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app).get('/api/staff/get-all-related-patients?username=testUser');
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
  });

  it('should return 401 if validation fails (invalid username/sessionToken)', async () => {
    const mockValidate = require('src/api/utils/validateStaffRequest').default;
    mockValidate.mockResolvedValueOnce({ isValid: false, status: 'UNAUTHORIZED', message: 'Invalid credentials' });

    const response = await request(app)
      .get('/api/staff/get-all-related-patients?username=testUser&sessionToken=invalidToken');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('UNAUTHORIZED');
  });

  it('should return 400 if no related patients are found', async () => {
    const mockValidate = require('src/api/utils/validateStaffRequest').default;
    const mockFetchPatients = require('../../repositories/fetchAllRelatedPatientByStaffID').default;

    mockValidate.mockResolvedValueOnce({ isValid: true, staff: { id: 1 } });
    mockFetchPatients.mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/staff/get-all-related-patients?username=testUser&sessionToken=validToken');

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe(' No patient found!');
  });

  it('should return 200 and the list of related patients', async () => {
    const mockValidate = require('src/api/utils/validateStaffRequest').default;
    const mockFetchPatients = require('../../repositories/fetchAllRelatedPatientByStaffID').default;

    const mockPatients = [
      { id: 1, name: 'Patient 1' },
      { id: 2, name: 'Patient 2' },
    ];

    mockValidate.mockResolvedValueOnce({ isValid: true, staff: { id: 1 } });
    mockFetchPatients.mockResolvedValueOnce(mockPatients);

    const response = await request(app)
      .get('/api/staff/get-all-related-patients?username=testUser&sessionToken=validToken');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.message).toBe('Successfully retrieved related patients!');
    expect(response.body.data.relatedPatients).toEqual(mockPatients);
  });

  it('should return 500 if there is a server error', async () => {
    const mockValidate = require('src/api/utils/validateStaffRequest').default;
    const mockFetchPatients = require('../../repositories/fetchAllRelatedPatientByStaffID').default;

    mockValidate.mockResolvedValueOnce({ isValid: true, staff: { id: 1 } });
    mockFetchPatients.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .get('/api/staff/get-all-related-patients?username=testUser&sessionToken=validToken');

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('SERVER_ERROR');
    expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
  });
});
