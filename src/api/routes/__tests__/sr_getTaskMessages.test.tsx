import request from 'supertest';
import express from 'express';
import getTaskMessages from '../../repositories/getTaskMessages';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getTaskMessages', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-task-messages', async (req, res) => {
    const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const messages = await getTaskMessages(sessionId as string);
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch task messages' });
  }
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
  describe('GET /api/staff/get-task-messages', () => {

    it('should be able to return the task messages', async () => {
        (getTaskMessages as jest.Mock).mockResolvedValue([
            { author: 'user', content: 'Cat', isFirst: true },
            { author: 'bot', content: 'It can fly.', isFirst: false }
        ]);

        const sessionId = '1';

        const response = await request(app)
            .get('/api/staff/get-task-messages')
            .query({ sessionId });

        expect(response.body).toEqual([
            { author: 'user', content: 'Cat', isFirst: true },
            { author: 'bot', content: 'It can fly.', isFirst: false }
        ]);
    });

    it('should return error when sessionId is missing', async () => {
        const response = await request(app)
            .get('/api/staff/get-task-messages');
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('sessionId is required');
    });

  });