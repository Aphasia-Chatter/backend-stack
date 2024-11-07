import request from 'supertest';
import express from 'express';
import getTimeTaken from '../../repositories/getTimeTaken';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getTimeTaken', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-time-taken', async (req, res) => {
    const { taskId } = req.query;

    console.log('Fetching time taken for task ID:', taskId);

    try {
      const timeTaken = await getTimeTaken(taskId as string);
      console.log('Time taken retrieved:', timeTaken);
      res.json(timeTaken);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the time taken' });
    }
});

beforeEach(() => {
  jest.clearAllMocks(); // Clear all mocks before each test
});

describe('GET /api/staff/get-time-taken', () => {

  it('should get the time taken', async () => {
    const taskId = '1';
    const mockResponse = {
      hours: 5,
      minutes: 0,
      seconds: 0,
      status: 'Completed'
    };

    (getTimeTaken as jest.Mock).mockResolvedValue(mockResponse);

    const response = await request(app)
      .get('/api/staff/get-time-taken')
      .query({ taskId });

      console.log('Response:', response);
      console.log('Response Body:', response.body);
   
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Completed');
  });

  it('should return error when startedAt is empty', async () => {
    const taskId = '2'; 
    
    (getTimeTaken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid data');
    });

    const response = await request(app)
      .get('/api/staff/get-time-taken')
      .query({ taskId });

    expect(response.body.error).toBe('An error occurred while fetching the time taken'); 
  });

  it('should return status "Incomplete" when completedAt is empty', async () => {
    const taskId = '2'; 
    const mockResponse = {
      hours: 5,
      minutes: 0,
      seconds: 0,
      status: 'Incomplete', // Expected status when completedAt is empty
    };

    (getTimeTaken as jest.Mock).mockResolvedValue({
      ...mockResponse,
      completedAt: null, // Simulating empty completedAt
    });

    const response = await request(app)
      .get('/api/staff/get-time-taken')
      .query({ taskId });

      console.log('Response:', response);
      console.log('Response Body:', response.body);
  
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Incomplete');

  });
  
});