import request from 'supertest';
import express from 'express';
import getPatientWordRetrievalTaskSession from '../../controllers/patient/getPatientWordRetrievalTaskById';

// Mock dependencies
jest.mock('src/api/repositories/selectWordRetrievalTaskByTaskID', () => jest.fn());
jest.mock('src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs', () => jest.fn());

import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import fetchAllPatientWordRetrievalTaskSessionsByTaskIDs from 'src/api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskIDs';

const app = express();
app.use(express.json());
app.get('/api/patient/word-retrieval-task-session', async (req, res) => {
  await getPatientWordRetrievalTaskSession(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/patient/word-retrieval-task-session', () => {
  it('should return 400 if taskID is missing', async () => {
    const response = await request(app)
      .get('/api/patient/word-retrieval-task-session');

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_REQUEST');
    expect(response.body.message).toBe('taskID is required.');
  });

  it('should return 400 if task is not found', async () => {
    (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/api/patient/word-retrieval-task-session')
      .query({ taskID: 'nonexistentTaskID' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_REQUEST');
    expect(response.body.message).toBe('Task with taskID nonexistentTaskID not found.');
  });

  it('should return 200 and the task session details if task is found', async () => {
    const mockTask = { id: 'task123', name: 'Sample Task' };
    const mockTaskSession = {
      id: 'session123',
      taskID: 'task123',
      startedAt: '2024-11-07T10:00:00Z',
      completedAt: '2024-11-07T12:00:00Z',
    };

    (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([mockTask]);
    (fetchAllPatientWordRetrievalTaskSessionsByTaskIDs as jest.Mock).mockResolvedValue([mockTaskSession]);

    const response = await request(app)
      .get('/api/patient/word-retrieval-task-session')
      .query({ taskID: 'task123' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('Task found.');
    expect(response.body.data).toEqual(mockTask);
    expect(response.body.taskSession).toEqual({
      taskSessionID: 'session123',
      startedAt: '2024-11-07T10:00:00Z',
      completedAt: '2024-11-07T12:00:00Z',
    });
  });
});
