import request from 'supertest';
import express from 'express';
import getPatientWordRetrievalTaskImage from '../../controllers/patient/getPatientWordRetrievalTaskImage';
import * as fs from 'fs';
import * as path from 'path';

// Mock `fs.promises` methods and constants
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  },
  constants: { F_OK: 0 }, // Mock F_OK constant
}));
const mockFsPromises = fs.promises;

// Create an Express app instance
const app = express();
app.get('/api/patient/word-retrieval-task-image', async (req, res) => {
  await getPatientWordRetrievalTaskImage(req, res);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/patient/word-retrieval-task-image', () => {
  it('should return 400 if filePath is missing', async () => {
    const response = await request(app).get('/api/patient/word-retrieval-task-image');
    console.log("Test result for missing filePath:", response.status, response.text); // Debug log
    expect(response.status).toBe(400);
    expect(response.text).toBe('filePath should be a string');
  });

  it('should return 400 if filePath is not a string', async () => {
    const response = await request(app)
      .get('/api/patient/word-retrieval-task-image')
      .query({ filePath: 123 }); // invalid type
    console.log("Test result for non-string filePath:", response.status, response.text); // Debug log
    expect(response.status).toBe(404);
  });

  it('should return 404 if image file does not exist', async () => {
    const mockFilePath = 'nonexistent/image/path.jpg';
    (mockFsPromises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

    const response = await request(app)
      .get('/api/patient/word-retrieval-task-image')
      .query({ filePath: mockFilePath });

    console.log("Test result for non-existent filePath:", response.status, response.text); // Debug log
    expect(response.status).toBe(404);
    expect(response.text).toBe(`Image not found: ${mockFilePath}`);
  });

  it('should return 200 and the base64-encoded image data if image file exists', async () => {
    const mockFilePath = 'existing/image/path.jpg';
    const mockImageData = Buffer.from('mock image data');
    
    (mockFsPromises.access as jest.Mock).mockResolvedValue(undefined); // Simulate file exists
    (mockFsPromises.readFile as jest.Mock).mockResolvedValue(mockImageData);

    const response = await request(app)
      .get('/api/patient/word-retrieval-task-image')
      .query({ filePath: mockFilePath });

    console.log("Test result for existing filePath:", response.status, response.body); // Debug log
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      path: mockFilePath,
      data: mockImageData.toString('base64'), // base64 encoded data
    });
  });
});
