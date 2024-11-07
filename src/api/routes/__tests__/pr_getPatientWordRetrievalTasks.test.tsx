import request from 'supertest';
import express from 'express';
import getPatientWordRetrievalTasks from '../../controllers/patient/getPatientWordRetrievalTasks';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectStaffByPatientId from 'src/api/repositories/selectStaffByPatientID';
import fetchAllPatientWordRetrievalTask from 'src/api/repositories/fetchAllPatientWordRetrievalTask';
import fetchAllPatientWordRetrievalTaskSessionsByTaskIDs from 'src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs';

// Mock dependencies
jest.mock('src/api/utils/validatePatientRequest');
jest.mock('src/api/repositories/selectStaffByPatientID');
jest.mock('src/api/repositories/fetchAllPatientWordRetrievalTask');
jest.mock('src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs');

const app = express();
app.get('/api/patient/word-retrieval-tasks', async (req, res) => {
  await getPatientWordRetrievalTasks(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/patient/word-retrieval-tasks', () => {
  it('should return 400 if username is missing', async () => {
    const response = await request(app).get('/api/patient/word-retrieval-tasks');
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser' });
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
    expect(response.body.message).toBe('session is missing in the request body field.');
  });

  it('should return 401 if validation fails', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: false, status: 'UNAUTHORIZED' });
    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser', sessionToken: 'token' });
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('UNAUTHORIZED');
  });

  it('should return 400 if patient staff does not exist', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectStaffByPatientId as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser', sessionToken: 'token' });
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_USERNAME');
    expect(response.body.message).toBe('User does not exist!');
  });

  it('should return 400 if no word retrieval tasks are found', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectStaffByPatientId as jest.Mock).mockResolvedValueOnce([{ staff: { id: 'staffId' } }]);
    (fetchAllPatientWordRetrievalTask as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser', sessionToken: 'token' });
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe(' No word retrieval tasks found!');
  });

  it('should return 200 with tasks and statuses', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectStaffByPatientId as jest.Mock).mockResolvedValueOnce([{ staff: { id: 'staffId' } }]);
    (fetchAllPatientWordRetrievalTask as jest.Mock).mockResolvedValueOnce([
      { word_retrieval_task: { taskID: 'task1' } },
      { word_retrieval_task: { taskID: 'task2' } },
    ]);
    (fetchAllPatientWordRetrievalTaskSessionsByTaskIDs as jest.Mock).mockResolvedValueOnce([
      { taskID: 'task1', id: 'session1', startedAt: new Date(), completedAt: null },
      { taskID: 'task2', id: 'session2', startedAt: new Date(), completedAt: new Date() },
    ]);

    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser', sessionToken: 'token' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.data.tasks).toEqual([
      expect.objectContaining({ word_retrieval_task: { taskID: 'task1' }, status: 'In Progress' }),
      expect.objectContaining({ word_retrieval_task: { taskID: 'task2' }, status: 'Completed' }),
    ]);
  });

  it('should return 500 if a server error occurs', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectStaffByPatientId as jest.Mock).mockImplementationOnce(() => { throw new Error('Server error'); });

    const response = await request(app).get('/api/patient/word-retrieval-tasks').query({ username: 'testuser', sessionToken: 'token' });
    expect(response.status).toBe(500);
    expect(response.body.status).toBe('SERVER_ERROR');
    expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
  });
});
