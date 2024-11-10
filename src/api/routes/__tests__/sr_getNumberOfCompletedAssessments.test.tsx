import request from 'supertest';
import express from 'express';
import getNumberOfCompletedAssessments from '../../../api/repositories/getNumberOfCompletedAssessments';

// Mock the getAssessmentDetails function
jest.mock('../../../api/repositories/getNumberOfCompletedAssessments', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get_num_assessments_completed/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    try {
        const count = await getNumberOfCompletedAssessments(patientId, today);
        res.status(200).send({ count });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while fetching the assessment count' });
    }
});

describe('GET /api/staff/get_num_assessments_completed/:patientId', () => {
    afterEach(() => {
        jest.clearAllMocks();
      });
    
      it('should return the number of completed assessments for a valid patient ID', async () => {
        const patientId = 'patient123';
        const expectedCount = 5;
      
        jest.mocked(getNumberOfCompletedAssessments).mockResolvedValueOnce({ count: expectedCount });
      
        const response = await request(app).get(`/api/staff/get_num_assessments_completed/${patientId}`);
      
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ count: { count: expectedCount } });
        expect(getNumberOfCompletedAssessments).toHaveBeenCalledWith(patientId, expect.any(String));
      });
    
      it('should return 500 for errors from getNumberOfCompletedAssessments', async () => {
        const patientId = 'patient456';
        jest.mocked(getNumberOfCompletedAssessments).mockRejectedValueOnce(new Error('Database error'));
    
        const response = await request(app).get(`/api/staff/get_num_assessments_completed/${patientId}`);
    
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'An error occurred while fetching the assessment count' });
        expect(getNumberOfCompletedAssessments).toHaveBeenCalledWith(patientId, expect.any(String)); // Check if function is called with correct patientId and a valid date string
      });
});