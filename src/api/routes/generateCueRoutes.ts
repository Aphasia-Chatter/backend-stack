import { Router, Request, Response } from 'express';
import { generateCues } from '../services/cues';

const router: Router = Router();

router.post('/', (req: Request, res: Response) => {
    generateCues(req, res);
});

export default router;