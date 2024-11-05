import request from 'supertest';
import express from 'express';
import getSuccessPercentage from '../../repositories/getSuccessPercentage';

// Mock the getAssessmentDetails function
jest.mock('../../repositories/getSuccessPercentage', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get-success-percentage/:patientId', async (req, res) => {
    const { patientId } = req.params;

    try {
        const successPercentage = await getSuccessPercentage(patientId);
        res.json(successPercentage);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the success percentage' });
    }
});

beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });
  
  describe('GET /api/staff/get-success-percentage', () => {

    it('should return the correct success percentage when results are available', async () => {
        (getSuccessPercentage as jest.Mock).mockResolvedValue({
            correctAnswersPercentage: 0.8
        });

        const patientId = '1';

        const response = await request(app)
            .get(`/api/staff/get-success-percentage/${patientId}`);

        expect(response.body.correctAnswersPercentage).toBe(0.8);

    });

    it('should return 0% success when no successful results are found', async () => {
       
        (getSuccessPercentage as jest.Mock).mockResolvedValue({
            correctAnswersPercentage: 0
        });
        
        const patientId = '1';

        const response = await request(app)
            .get(`/api/staff/get-success-percentage/${patientId}`);

        expect(response.body.correctAnswersPercentage).toBe(0);
    });

    it('should return 0% success when there are no results for the patient', async () => {

        (getSuccessPercentage as jest.Mock).mockResolvedValue({
            correctAnswersPercentage: 0, // 0% success rate when no records are found
        });

        const patientId = '1';

        const response = await request(app)
            .get(`/api/staff/get-success-percentage/${patientId}`);

        expect(response.body.correctAnswersPercentage).toBe(0);
    });

  });