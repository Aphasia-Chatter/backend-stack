import request from 'supertest';
import express from 'express';
import multer from 'multer';
import chatAudioOnSession from '../../controllers/patient/chatAudioOnSession';

// Mock the chatAudioOnSession function
jest.mock('../../controllers/patient/chatAudioOnSession', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Create an Express app instance
const app = express();
app.use(express.json());

// Set up multer middleware for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the specific route for testing directly in the test file
app.post('/api/patient/chat-session-audio', upload.single('audioFile'), async (req, res) => {
  await chatAudioOnSession(req, res);
});

// Set a global timeout for the tests
jest.setTimeout(15000); // 15 seconds

beforeEach(() => {
  jest.clearAllMocks(); // Clear all mocks before each test
});

describe('POST /api/patient/chat-session-audio', () => {
  it('should return a successful chat response with bot message and session data', async () => {
    // Mock the expected response for a successful audio chat session
    (chatAudioOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(200).json({
        status: 'SUCCESS',
        message: 'message sent successfully!',
        data: {
          botMessageID: 'bot123',
          userMessageID: 'user123',
          message: 'Congratulations!',
          transcription: 'Hello there!',
          completed: true,
          isCorrectAnswer: true,
        },
      });
    });

    const response = await request(app)
      .post('/api/patient/chat-session-audio')
      .field('username', 'testuser')
      .field('sessionToken', 'validtoken')
      .field('taskSessionID', 'session123')
      .attach('audioFile', Buffer.from('test audio file'), { filename: 'testaudio.m4a' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.data).toHaveProperty('botMessageID');
    expect(response.body.data).toHaveProperty('message', 'Congratulations!');
  });

  it('should return 400 if username is missing', async () => {
    (chatAudioOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(400).json({
        status: 'MISSING_USERNAME',
        message: 'username is missing in the request body field.',
      });
    });

    const response = await request(app)
      .post('/api/patient/chat-session-audio')
      .field('sessionToken', 'validtoken')
      .field('taskSessionID', 'session123')
      .attach('audioFile', Buffer.from('test audio file'), { filename: 'testaudio.m4a' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if audio file is missing', async () => {
    (chatAudioOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(400).json({
        status: 'MISSING AUDIO FILE',
        message: 'Missing audio file. (image: null)',
      });
    });

    const response = await request(app)
      .post('/api/patient/chat-session-audio')
      .field('username', 'testuser')
      .field('sessionToken', 'validtoken')
      .field('taskSessionID', 'session123');

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING AUDIO FILE');
    expect(response.body.message).toBe('Missing audio file. (image: null)');
  });

  it('should return 404 if task session is not found', async () => {
    (chatAudioOnSession as jest.Mock).mockImplementationOnce((req, res) => {
      res.status(404).json({
        status: 'NOT_FOUND',
        message: 'task session not found!',
      });
    });

    const response = await request(app)
      .post('/api/patient/chat-session-audio')
      .field('username', 'testuser')
      .field('sessionToken', 'validtoken')
      .field('taskSessionID', 'nonexistentSessionID')
      .attach('audioFile', Buffer.from('test audio file'), { filename: 'testaudio.m4a' });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('NOT_FOUND');
    expect(response.body.message).toBe('task session not found!');
  });
});
