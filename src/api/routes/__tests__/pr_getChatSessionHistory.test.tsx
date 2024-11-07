import request from 'supertest';
import express from 'express';
import getChatSessionHistory from '../../controllers/patient/getChatSessionHistory';
import selectTaskSessionByID from '../../repositories/selectTaskSessionByID';
import selectSessionMessagesBySessionID from '../../repositories/selectSessionMessagesBySessionID';
import selectWordRetrievalTaskByTaskID from '../../repositories/selectWordRetrievalTaskByTaskID';
import insertLog from '../../repositories/insertLog';

// Mock the dependencies
jest.mock('../../repositories/selectTaskSessionByID');
jest.mock('../../repositories/selectSessionMessagesBySessionID');
jest.mock('../../repositories/selectWordRetrievalTaskByTaskID');
jest.mock('../../repositories/insertLog');

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.post('/api/patient/chat-histories', async (req, res) => {
  await getChatSessionHistory(req, res);
});

beforeEach(() => {
  jest.clearAllMocks(); // Clear all mocks before each test
});

describe('POST /api/patient/chat-histories', () => {
  it('should return chat session history successfully', async () => {
    try {
      // Mock the database response
      (selectTaskSessionByID as jest.Mock).mockResolvedValue([{ taskID: 'task123', id: 'session123' }]);
      (selectWordRetrievalTaskByTaskID as jest.Mock).mockResolvedValue([{ id: 'task123' }]); // Mock task retrieval
      (selectSessionMessagesBySessionID as jest.Mock).mockResolvedValue([
        { id: '1', author: 'user', content: 'Hello', sentAt: '2024-11-07T10:00:00Z', audioFilePath: null },
        { id: '2', author: 'bot', content: 'Hi, how can I help?', sentAt: '2024-11-07T10:01:00Z', audioFilePath: null }
      ]);

      const response = await request(app)
        .post('/api/patient/chat-histories')
        .send({
          username: 'testuser',
          sessionToken: 'validtoken',
          taskSessionID: 'session123'
        });

      console.log('Response:', response.body); // Debugging log

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SUCCESS');
      expect(response.body.data.messages).toEqual([
        {
          id: '1',
          author: 'user',
          content: 'Hello',
          timestamp: '2024-11-07T10:00:00Z',
          hasAudio: false
        },
        {
          id: '2',
          author: 'bot',
          content: 'Hi, how can I help?',
          timestamp: '2024-11-07T10:01:00Z',
          hasAudio: false
        }
      ]);
    } catch (error) {
      console.error('Test case failed with error:', error);
      throw error;
    }
  });

  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/api/patient/chat-histories')
      .send({
        sessionToken: 'validtoken',
        taskSessionID: 'session123'
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app)
      .post('/api/patient/chat-histories')
      .send({
        username: 'testuser',
        taskSessionID: 'session123'
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
    expect(response.body.message).toBe('session is missing in the request body field.');
  });

  it('should return 400 if taskSessionID is missing', async () => {
    const response = await request(app)
      .post('/api/patient/chat-histories')
      .send({
        username: 'testuser',
        sessionToken: 'validtoken'
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_TASK_ID');
    expect(response.body.message).toBe('task id is missing in the request body field.');
  });

  it('should return 404 if task session is not found', async () => {
    (selectTaskSessionByID as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .post('/api/patient/chat-histories')
      .send({
        username: 'testuser',
        sessionToken: 'validtoken',
        taskSessionID: 'nonexistentSessionID'
      });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('NOT_FOUND');
    expect(response.body.message).toBe('task session not found!');
  });

  it('should return 500 if there is a server error', async () => {
    (selectTaskSessionByID as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/patient/chat-histories')
      .send({
        username: 'testuser',
        sessionToken: 'validtoken',
        taskSessionID: 'session123'
      });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('SERVER_ERROR');
    expect(response.body.message).toBe('Server encountered an error! Contact admin if persists!');
  });
});
