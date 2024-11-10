import request from 'supertest';
import express from 'express';
import chatOnSession from '../../controllers/patient/chatOnSession';

// Mock the chatOnSession function
jest.mock('../../controllers/patient/chatOnSession', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Define the specific route for testing directly in the test file
app.post('/api/patient/chat-session', async (req, res) => {
  await chatOnSession(req, res);
});

// Set a global timeout for the tests
jest.setTimeout(10000); // 10 seconds

beforeEach(() => {
  jest.clearAllMocks(); // Clear all mocks before each test
});

describe('POST /api/patient/chat-session', () => {
  it('should return a successful chat response with bot message and session data', (done) => {
    // Mock the expected response for a successful chat session
    (chatOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(200).json({
        status: 'SUCCESS',
        message: 'message sent successfully!',
        data: {
          botMessageID: 'bot123',
          userMessageID: 'user123',
          message: 'Congratulations!',
          completed: true,
          isCorrectAnswer: true,
        },
      });
      done();
    });

    request(app)
      .post('/api/patient/chat-session')
      .send({
        username: 'testuser',
        sessionToken: 'validtoken',
        taskSessionID: 'session123',
        content: 'Hello',
      })
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('SUCCESS');
        expect(response.body.data).toHaveProperty('botMessageID');
        expect(response.body.data).toHaveProperty('message', 'Congratulations!');
        done();
      })
      .catch(done);
  });

  it('should return 400 if username is missing', (done) => {
    // Mock the response to simulate missing username field
    (chatOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(400).json({
        status: 'MISSING_USERNAME',
        message: 'username is missing in the request body field.',
        data: {},
      });
      done();
    });

    request(app)
      .post('/api/patient/chat-session')
      .send({
        sessionToken: 'validtoken',
        taskSessionID: 'session123',
        content: 'Hello',
      })
      .then((response) => {
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('MISSING_USERNAME');
        expect(response.body.message).toBe('username is missing in the request body field.');
        done();
      })
      .catch(done);
  });

  it('should return 404 if task session is not found', (done) => {
    // Mock a rejected response for a non-existent session
    (chatOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(404).json({
        status: 'NOT_FOUND',
        message: 'task session not found!',
      });
      done();
    });

    request(app)
      .post('/api/patient/chat-session')
      .send({
        username: 'testuser',
        sessionToken: 'validtoken',
        taskSessionID: 'nonexistentSessionID',
        content: 'Hello',
      })
      .then((response) => {
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('NOT_FOUND');
        expect(response.body.message).toBe('task session not found!');
        done();
      })
      .catch(done);
  });
});
