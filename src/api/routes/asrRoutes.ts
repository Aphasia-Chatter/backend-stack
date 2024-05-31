import { Router, Request, Response } from 'express';
import { transcribe } from '../services/asr'


const router: Router = Router();

// /api/asr/transcribe
router.post('/transcribe', (req: Request, res: Response) => {
    transcribe(req, res);
});

export default router