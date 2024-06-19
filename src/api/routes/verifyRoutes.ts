import { Router, Request, Response } from 'express';
import { verify } from '../services/verify';

const router: Router = Router();

// /api/verify/
router.post('/', (req: Request, res: Response) => {
  verify(req, res)
});

export default router;
