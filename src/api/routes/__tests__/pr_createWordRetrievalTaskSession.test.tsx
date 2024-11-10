import request from 'supertest';
import express from 'express';
import createWordRetrievalTaskSession from '../../controllers/patient/createWordRetrievalTaskSession';

// Mock dependencies
jest.mock('src/api/repositories/selectWordRetrievalTaskByTaskID', () => jest.fn());
jest.mock('src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskID', () => jest.fn());
jest.mock('src/api/repositories/insertWordRetrievalTaskSession', () => jest.fn());
jest.mock('src/api/utils/validatePatientRequest', () => jest.fn());
jest.mock('src/api/repositories/insertLog', () => jest.fn());

// Import mocks
import selectWordRetrievalTaskByTaskID from 'src/api/repositories/selectWordRetrievalTaskByTaskID';
import selectWordRetrievalTaskSessionByPatientIDAndTaskID from 'src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskID';
import insertWordRetrievalTaskSession from 'src/api/repositories/insertWordRetrievalTaskSession';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';

const app = express();
app.use(express.json());
app.post('/api/patient/create-word-retrieval-task-session', async (req, res) => {
  await createWordRetrievalTaskSession(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/patient/create-word-retrieval-task-session', () => {
  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', taskID: 'task123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
    expect(response.body.message).toBe('session is missing in the request body field.');
  });

  it('should return 400 if taskID is missing', async () => {
    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_TASK_ID');
    expect(response.body.message).toBe('task id is missing in the request body field.');
  });

  it('should return 401 if patient validation fails', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: false, status: 'INVALID_SESSION', message: 'Invalid session' });

    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('INVALID_SESSION');
    expect(response.body.message).toBe('Invalid session');
  });

  it('should return 400 if task does not exist', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_TASK');
    expect(response.body.message).toBe('Task does not exist!');
  });

  it('should return 400 if task session already exists for the patient', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([{ task: { name: 'Task 1' } }]);
    (selectWordRetrievalTaskSessionByPatientIDAndTaskID as jest.Mock).mockResolvedValue([{ id: 'session123' }]);

    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_TASK_SESSION');
    expect(response.body.message).toBe('Task session already exist!');
  });

  it('should return 201 and create a task session successfully', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([{ task: { name: 'Task 1' } }]);
    (selectWordRetrievalTaskSessionByPatientIDAndTaskID as jest.Mock).mockResolvedValue([]);
    (insertWordRetrievalTaskSession as jest.Mock).mockResolvedValue([{ id: 'session123', taskID: 'task123' }]);

    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('CREATE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS');
    expect(response.body.message).toBe('The new task session for task Task 1 has been created');
    expect(response.body.data).toHaveProperty('taskSessionID', 'session123');
    expect(response.body.data).toHaveProperty('taskID', 'task123');
  });

  it('should return 500 if there is a server error', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectWordRetrievalTaskByTaskID as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/patient/create-word-retrieval-task-session')
      .send({ username: 'testUser', sessionToken: 'validToken', taskID: 'task123' });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('SERVER_ERROR');
    expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
  });
});
