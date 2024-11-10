import { Request, Response } from 'express';
import getWordRetrievalTasksOngoingSessionCount from '../../../api/controllers/staff/taskGetter/getWordRetrievalTaskOngoingSessionCount';  // Adjust to actual path
import validateStaffRequest from '../../utils/validateStaffRequest';
import fetchAllPatientWordRetrievalTaskSessionsByTaskID from '../../../api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskID';

// Mock the external functions
jest.mock('../../utils/validateStaffRequest');
jest.mock('../../../api/repositories/fetchAllPatientWordRetrievalTaskSessionsByTaskID');

describe('getWordRetrievalTasksOngoingSessionCount', () => {
    
    let res: Response;
    let req: Request;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        req = {
            query: {
                username: 'testuser',
                taskId: '123',
            },
        } as unknown as Request;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return ongoing session count successfully', async () => {
  
        (validateStaffRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, status: 'VALID', message: 'Valid staff' });

        // Mock fetch function with ongoing sessions
        (fetchAllPatientWordRetrievalTaskSessionsByTaskID as jest.Mock).mockResolvedValueOnce([
            { startedAt: '2024-11-10T12:00:00Z', completedAt: null },
            { startedAt: '2024-11-09T14:00:00Z', completedAt: null },
        ]);

        await getWordRetrievalTasksOngoingSessionCount(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'SUCCESS',
            message: 'Successfully retrieved word retrieval task ongoing session count!',
            data: { wordRetrievalTaskOngoingSessionCount: 2 },
        });
    });

    it('should return 0 if no ongoing sessions found', async () => {
      
        (validateStaffRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, status: 'VALID', message: 'Valid staff' });

        // Mock fetch function with no ongoing sessions
        (fetchAllPatientWordRetrievalTaskSessionsByTaskID as jest.Mock).mockResolvedValueOnce([
            { startedAt: '2024-11-10T12:00:00Z', completedAt: '2024-11-10T12:30:00Z' },
        ]);

        await getWordRetrievalTasksOngoingSessionCount(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'SUCCESS',
            message: 'Successfully retrieved word retrieval task ongoing session count!',
            data: { wordRetrievalTaskOngoingSessionCount: 0 },
        });
    });

    it('should return 400 if staff validation fails', async () => {
       
        (validateStaffRequest as jest.Mock).mockResolvedValueOnce({ isValid: false, status: 'FAILED', message: 'Invalid staff' });

        await getWordRetrievalTasksOngoingSessionCount(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'FAILED',
            message: 'Invalid staff',
            data: {},
        });
    });

    it('should return 400 if no sessions are found for the given taskId', async () => {
      
        (validateStaffRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, status: 'VALID', message: 'Valid staff' });

        // Mock fetch function with no sessions found
        (fetchAllPatientWordRetrievalTaskSessionsByTaskID as jest.Mock).mockResolvedValueOnce(null);

        await getWordRetrievalTasksOngoingSessionCount(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status: 'FAILED',
            message: ' No word retrieval task ongoing session count found.',
            data: {},
        });
    });

    it('should return 500 on server error', async () => {
       
        (validateStaffRequest as jest.Mock).mockResolvedValueOnce({ isValid: true, status: 'VALID', message: 'Valid staff' });

        // Simulate an error in fetch function
        (fetchAllPatientWordRetrievalTaskSessionsByTaskID as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

        await getWordRetrievalTasksOngoingSessionCount(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            status: 'SERVER_ERROR',
            message: 'Server encountered an error! Contact admin if persists!',
            data: {},
        });
    });
});
