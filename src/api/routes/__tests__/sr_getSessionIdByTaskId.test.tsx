import request from 'supertest';
import express from 'express';
import getSessionIdByTaskId from '../../repositories/getSessionIdByTaskId';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getSessionIdByTaskId', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-session-id-by-task-id', async (req, res) => {
    const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).send({ error: 'Task ID is required and must be a string' });
  }

  try {
    const sessionId = await getSessionIdByTaskId(taskId as string);
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the session ID' });
  }
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
  describe('GET /api/staff/get-session-id-by-task-id', () => {

    it('should return the session', async () => {
        const taskId = '1';

        (getSessionIdByTaskId as jest.Mock).mockResolvedValue('10');

        const response = await request(app)
            .get('/api/staff/get-session-id-by-task-id')
            .query({ taskId });

        expect(response.body.sessionId).toBe('10');
    });

    it('should return 400 if taskId is missing', async () => {
        const response = await request(app)
            .get('/api/staff/get-session-id-by-task-id');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Task ID is required and must be a string');
    });
  });