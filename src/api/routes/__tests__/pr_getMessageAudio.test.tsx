import request from 'supertest';
import express from 'express';
import getMessageAudio from '../../controllers/patient/getMessageAudio';

// Mock dependencies
jest.mock('src/api/utils/validatePatientRequest', () => jest.fn());
jest.mock('src/api/repositories/selectMessageByID', () => jest.fn());
jest.mock('src/api/repositories/selectTaskSessionByID', () => jest.fn());
jest.mock('src/api/repositories/insertLog', () => jest.fn());
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  },
  constants: { F_OK: 0 },
}));
jest.mock('path', () => ({
  resolve: jest.fn((filePath) => `/resolved/path/to/${filePath}`),
}));

import validatePatientRequest from 'src/api/utils/validatePatientRequest';
import selectMessageByID from 'src/api/repositories/selectMessageByID';
import selectTaskSessionByID from 'src/api/repositories/selectTaskSessionByID';
import insertLog from 'src/api/repositories/insertLog';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.post('/api/patient/get-message-audio', async (req, res) => {
  await getMessageAudio(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/patient/get-message-audio', () => {
  it('should return 400 if username is missing', async () => {
    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_USERNAME');
    expect(response.body.message).toBe('username is missing in the request body field.');
  });

  it('should return 400 if sessionToken is missing', async () => {
    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', messageID: 'message123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_SESSION');
    expect(response.body.message).toBe('session is missing in the request body field.');
  });

  it('should return 400 if messageID is missing', async () => {
    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('MISSING_TASK_ID');
    expect(response.body.message).toBe('task id is missing in the request body field.');
  });

  it('should return 401 if patient validation fails', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: false, status: 'INVALID_SESSION', message: 'Invalid session' });

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('INVALID_SESSION');
    expect(response.body.message).toBe('Invalid session');
  });

  it('should return 404 if message is not found', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe('Message not found.');
  });

  it('should return 404 if session is not found', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockResolvedValue([{ sessionID: 'session123' }]);
    (selectTaskSessionByID as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe('Session not found.');
  });

  it('should return 401 if the session does not belong to the patient', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockResolvedValue([{ sessionID: 'session123', audioFilePath: '/path/to/audio' }]);
    (selectTaskSessionByID as jest.Mock).mockResolvedValue([{ patientID: 'otherPatientID' }]);

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('NOT_PATIENT_SESSION');
    expect(response.body.message).toBe('No access to view voice recordings');
  });

  it('should return 404 if audio file path is missing', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockResolvedValue([{ sessionID: 'session123', audioFilePath: null }]);
    (selectTaskSessionByID as jest.Mock).mockResolvedValue([{ patientID: 'patient123' }]);

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe('Message audio not found.');
  });

  it('should return 200 and base64 encoded audio data on successful request', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockResolvedValue([{ sessionID: 'session123', audioFilePath: '/path/to/audio' }]);
    (selectTaskSessionByID as jest.Mock).mockResolvedValue([{ patientID: 'patient123' }]);
    (fs.promises.access as jest.Mock).mockResolvedValue(true);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(Buffer.from('audio data'));

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.message).toBe('Data is a base64 encoded string.');
    expect(response.body.data).toBe(Buffer.from('audio data').toString('base64'));
  });

  it('should return 500 if there is a server error', async () => {
    (validatePatientRequest as jest.Mock).mockResolvedValue({ isValid: true, patient: { id: 'patient123' } });
    (selectMessageByID as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/patient/get-message-audio')
      .send({ username: 'testUser', sessionToken: 'validToken', messageID: 'message123' });

    expect(response.status).toBe(500);
    expect(response.body.status).toBe('FAILED');
    expect(response.body.message).toBe('Error while fetching message audio.');
  });
});
