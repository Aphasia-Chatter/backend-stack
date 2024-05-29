import { Router, Request, Response } from 'express';
import login, { LoginType } from '../controllers/login';
import checkToken from '../controllers/checkToken';

const router: Router = Router();

// /api/staff/login
router.post('/login', (req: Request, res: Response) => {
  login(req, res, LoginType.STAFF)
});

// /api/staff/validate-token?username=xxx
router.get('/validate-token', (req: Request, res: Response) => {
  checkToken(req, res)
});

export default router;
