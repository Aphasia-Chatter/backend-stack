import { Router, Request, Response } from 'express';
import login from '../controllers/login';

const router: Router = Router();

// /api/staff/login
router.post('/login', (req: Request, res: Response) => {
  login(req, res)
});

export default router;
