import { Router, Request, Response } from 'express';
import login, { LoginType } from '../controllers/login';

const router: Router = Router();

// /api/staff/login
router.post('/login', (req: Request, res: Response) => {
  login(req, res, LoginType.PATIENT)
});

export default router;
