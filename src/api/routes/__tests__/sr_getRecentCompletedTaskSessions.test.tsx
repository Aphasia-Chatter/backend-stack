import request from 'supertest';
import express from 'express';
import getRecentCompletedTaskSessions from '../../repositories/getRecentCompletedTaskSessions';

// Mock the getAssessmentDetails function
jest.mock('../../../api/repositories/getRecentCompletedTaskSessions', () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.get('/api/staff/get_recent_task_sessions_completed/:patientId', async (req, res) => {
    const { patientId } = req.params;

  try {
    const taskSessions = await getRecentCompletedTaskSessions(patientId);
    return res.json(taskSessions);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching the assessments' });
  }
});

describe('GET /api/staff/get_num_assessments_completed/:patientId', () => {
    afterEach(() => {
        jest.clearAllMocks();
      });

    it('should return the task sessions successfully', async () => {
        const patientId = 'patient123';
        const expectedSessions = [
          { taskName: 'Task A', completedAt: '2024-11-10T00:00:00.000Z', taskId: 'task-id-1' },
          { taskName: 'Task B', completedAt: '2024-11-09T00:00:00.000Z', taskId: 'task-id-2' },
        ];
    
        jest.mocked(getRecentCompletedTaskSessions).mockResolvedValueOnce(expectedSessions);
    
        const response = await request(app).get(`/api/staff/get_recent_task_sessions_completed/${patientId}`);
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expectedSessions);
        expect(getRecentCompletedTaskSessions).toHaveBeenCalledWith(patientId);
    });
});