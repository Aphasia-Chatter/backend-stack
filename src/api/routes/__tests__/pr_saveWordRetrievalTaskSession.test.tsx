import request from 'supertest';
import express from 'express';
import saveWordRetrievalTaskSession from '../../controllers/patient/saveWordRetrievalTaskSession';
import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID from 'src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID';
import updateWordRetrievalTaskSessionByID from 'src/api/repositories/updateWordRetrievalTaskSessionByID';

// Mock dependencies
jest.mock('src/api/utils/validatePatientRequest');
jest.mock('src/api/repositories/selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID');
jest.mock('src/api/repositories/updateWordRetrievalTaskSessionByID');

const app = express();
app.use(express.json());
app.post('/api/patient/save-word-retrieval-task-session', async (req, res) => {
  await saveWordRetrievalTaskSession(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/patient/save-word-retrieval-task-session', () => {
  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ sessionToken: 'token', taskSessionID: 'sessionId' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', taskSessionID: 'sessionId' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
    expect(response.body.message).toBe('session is missing in the request body field.');
  });

  it('should return 400 if taskSessionID is missing', async () => {
    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', sessionToken: 'token' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_TASK_SESSION_ID');
    expect(response.body.message).toBe('task session id is missing in the request body field.');
  });

  it('should return 401 if validation fails', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: false, status: 'UNAUTHORIZED' });
    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', sessionToken: 'token', taskSessionID: 'sessionId' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('UNAUTHORIZED');
  });

  it('should return 400 if task session does not exist', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', sessionToken: 'token', taskSessionID: 'sessionId' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('BAD_TASK_SESSION');
    expect(response.body.message).toBe('Task session does not exist!');
  });

  it('should return 201 if task session is already completed', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID as jest.Mock).mockResolvedValueOnce([
      { completedAt: new Date() },
    ]);

    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', sessionToken: 'token', taskSessionID: 'sessionId', hintsUsedCount: 2, completedAt: new Date().toISOString() });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('SAVE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS');
    expect(response.body.message).toBe('The new task session for task has been created');
  });

  it('should return 201 and update task session if not completed', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID as jest.Mock).mockResolvedValueOnce([
      { completedAt: null },
    ]);

    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({
        username: 'testuser',
        sessionToken: 'token',
        taskSessionID: 'sessionId',
        hintsUsedCount: 2,
        completedAt: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(updateWordRetrievalTaskSessionByID).toHaveBeenCalledWith(
      'patientId',
      'sessionId',
      2,
      expect.any(Date)
    );
    expect(response.body.status).toBe('CREATE_WORD_RETRIEVAL_TASK_SESSION_SUCCESS');
    expect(response.body.message).toBe('The new task session for task has been created');
  });

  it('should return 500 if a server error occurs', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, patient: { id: 'patientId' } });
    (selectWordRetrievalTaskSessionByPatientIDAndTaskSessionID as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Server error');
    });

    const response = await request(app)
      .post('/api/patient/save-word-retrieval-task-session')
      .send({ username: 'testuser', sessionToken: 'token', taskSessionID: 'sessionId' });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('SERVER_ERROR');
    expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
  });
});
