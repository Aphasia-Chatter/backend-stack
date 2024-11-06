import request from 'supertest';
import express from 'express';
import getAnswerStatus from '../../repositories/getAnswerStatus';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getAnswerStatus', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-answer-status', async (req, res) => {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Task ID is required and must be a string' });
    }
  
    try {
      const isSuccessful = await getAnswerStatus(taskId as string);
      res.json({ isSuccessful });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the answer status' });
    }
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
  describe('GET /api/staff/get-answer-status', () => {

    it('should return the answer status', async () => {

        const taskId = '1';

        (getAnswerStatus as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
            .get('/api/staff/get-answer-status')
            .query({ taskId });

        expect(response.body.isSuccessful).toBe(true);
    });

    it('should return 400 if taskId is missing', async () => {
        const response = await request(app)
            .get('/api/staff/get-answer-status');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Task ID is required and must be a string');
    });
  });