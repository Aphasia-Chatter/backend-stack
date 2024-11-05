import request from 'supertest';
import express from 'express';
import getAssessmentDetails from '../../repositories/getAssessmentDetails';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getAssessmentDetails', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-assessment-details', async (req, res) => {
    const { patientId, taskId } = req.query;

    try {
        const details = await getAssessmentDetails(patientId as string, taskId as string);
        res.json(details);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the assessment details' });
    }
});

describe('GET /api/staff/get-assessment-details', () => {
    it('should get assessment details', async () => {
        // Arrange
        const patientId = '123';
        const taskId = '456';
        const mockDetails = {
            patientUsername: 'john_doe',
            taskDescription: 'Complete the assessment'
        };

        // Set up mock implementation for getAssessmentDetails
        (getAssessmentDetails as jest.Mock).mockResolvedValue(mockDetails);

        // Act
        const response = await request(app)
            .get('/api/staff/get-assessment-details')
            .query({ patientId, taskId });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockDetails);
    });

    it('should return a 500 error if getAssessmentDetails fails', async () => {
        // Arrange
        (getAssessmentDetails as jest.Mock).mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/api/staff/get-assessment-details')
            .query({ patientId: '123', taskId: '456' });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'An error occurred while fetching the assessment details' });
    });
});
