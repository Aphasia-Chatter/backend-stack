import request from 'supertest';
import express from 'express';
import multer from 'multer';
import configureTask, { TaskType } from '../../../api/controllers/staff/taskConfigure/configureTask';
import { configureWordRetrevialTask } from '../../../api/controllers/staff/taskConfigure/configureWordRetrevialTask';
import validateStaffRequest from 'src/api/utils/validateStaffRequest';

// Mock dependencies
jest.mock('src/api/utils/validateStaffRequest', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../../api/controllers/staff/taskConfigure/configureWordRetrevialTask', () => ({
    __esModule: true,
    configureWordRetrevialTask: jest.fn(),
}));

// Setup Express app for testing
const app = express();
const multerMiddleware = multer().none(); // No file handling for this test

app.use(express.json());
app.put('/api/staff/modify-word-retrieval-task', multerMiddleware, (req, res) => {
    configureTask(req, res, TaskType.WORD_RETREVIAL);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('PUT /modify-word-retrieval-task', () => {
    it('should return 400 if staff validation fails', async () => {
        const mockValidate = validateStaffRequest as jest.Mock;
        mockValidate.mockResolvedValueOnce({
            isValid: false,
            status: 'UNAUTHORIZED',
            message: 'Invalid credentials',
        });

        const response = await request(app)
            .put('/api/staff/modify-word-retrieval-task')
            .send({ username: 'testUser', task_id: '123' });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('UNAUTHORIZED');
        expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if task_id is missing', async () => {
        const mockValidate = validateStaffRequest as jest.Mock;
        mockValidate.mockResolvedValueOnce({ isValid: true, staff: { id: 1, username: 'staff1' } });

        const response = await request(app)
            .put('/api/staff/modify-word-retrieval-task')
            .send({ username: 'testUser' }); // Missing task_id

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('TASK_ID_REQUIRED');
        expect(response.body.message).toBe('Missing parameter of task_id');
    });

    
});
