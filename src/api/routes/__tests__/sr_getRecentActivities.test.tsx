import request from 'supertest';
import express from 'express';
import getRecentActivities from '../../../api/repositories/getRecentActivities';

// Mock the getAssessmentDetails function
jest.mock('../../../api/repositories/getRecentActivities', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

app.get('/api/staff/get_recent_activities/:patientId', async (req, res) => {
    const { patientId } = req.params;

    try {
        const activity = await getRecentActivities(patientId);
        return res.json(activity);
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while fetching the activities'});
    }
});

describe('GET /api/staff/get_recent_activities/:patientId', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return an array of activity data for a valid patient ID', async () => {
        const patientId = 'patient123';
        const expectedActivities = [
          { day: '2024-11-03', count: 2 },
          { day: '2024-11-09', count: 1 },
        ];
    
        jest.mocked(getRecentActivities).mockResolvedValueOnce(expectedActivities);
    
        const response = await request(app).get(`/api/staff/get_recent_activities/${patientId}`);
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedActivities);
        expect(getRecentActivities).toHaveBeenCalledWith(patientId);
    });

});