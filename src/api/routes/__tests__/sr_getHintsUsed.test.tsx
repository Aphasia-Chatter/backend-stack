import request from 'supertest';
import express from 'express';
import getHintsUsed from '../../repositories/getHintsUsed';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getHintsUsed', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-hints-used', async (req, res) => {
    const { taskId } = req.query;

    try {
        const hintsUsed = await getHintsUsed(taskId as string);
        res.json(hintsUsed);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching hints used' });
    }
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
  describe('GET /api/staff/get-hints-used', () => {

    it('should get the number of hints used', async () => {

        (getHintsUsed as jest.Mock).mockResolvedValue({
            hintsUsedCount: 3, // Simulate hints used count returned by the function
        });

        const taskId = '1';

        const response = await request(app)
            .get('/api/staff/get-hints-used')
            .query({ taskId });

        expect(response.body).toEqual({ hintsUsedCount: 3 });

    });

    it('should return error when no session result is found', async () => {

        (getHintsUsed as jest.Mock).mockImplementation(() => {
            throw new Error('Data not found');
        });

        const taskId = '2'; //invalid taskId

        const response = await request(app)
            .get('/api/staff/get-hints-used')
            .query({ taskId });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('An error occurred while fetching hints used');
    });
  });