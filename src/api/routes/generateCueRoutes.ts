import { Router, Request, Response } from 'express';
import { generateCues } from '../services/cues';

const router: Router = Router();

router.post('/phonetic', (req: Request, res: Response) => {
    generateCues(req, res, 'phonetic');
});

router.post('/semantic', (req: Request, res: Response) => {
    generateCues(req, res, 'semantic');
});

export default router;