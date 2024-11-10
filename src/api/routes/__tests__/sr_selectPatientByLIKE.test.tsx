import request from 'supertest';
import express from 'express';
import selectPatientsByLIKE from '../../repositories/selectPatientsByLIKE';

// Mock the selectPatientsByLIKE function
jest.mock('../../repositories/selectPatientsByLIKE', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((req, res) => {
    const query = req.query.query as string;
    if (query === 'patient1') {
      res.json([{ username: 'patient1', enrolledAt: new Date('2023-10-26') }]);
    } else {
      // Handle other cases or errors as needed
      res.status(404).json({ error: 'Patient not found' });
    }
  }),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/filter', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is missing' });
  }

  try {
    await selectPatientsByLIKE(req, res, query as string);
  } catch (error) {
    console.error('Error fetching filtered patients:', error);
    return res.status(500).json({ error: 'An error occurred while fetching the filtered patients' });
  }
});

describe('GET /api/staff/filter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 error for missing query parameter', async () => {
    const response = await request(app).get('/api/staff/filter');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Query parameter is missing' });
  });

  it('should return filtered patients for a valid query', async () => {
    const query = 'patient1';
    const expectedPatients = [{ username: 'patient1', enrolledAt: new Date('2023-10-26').toISOString() }];

    const response = await request(app).get(`/api/staff/filter?query=${query}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expectedPatients);
  });

  it('should handle errors from selectPatientsByLIKE', async () => {
    const query = 'invalid_query';

    const response = await request(app).get(`/api/staff/filter?query=${query}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Patient not found' });
  });
});