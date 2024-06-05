import { Router, Request, Response } from 'express';
import login, { LoginType } from '../controllers/login';
import register, { RegisterType } from '../controllers/register';
import checkToken from '../controllers/checkToken';

const router: Router = Router();

// /api/patient/login
router.post('/login', (req: Request, res: Response) => {
  login(req, res, LoginType.PATIENT)
});

// /api/patient/validate-token?username=xxx
router.get('/validate-token', (req: Request, res: Response) => {
  checkToken(req, res)
});

// /api/patient/register
router.post('/register', (req: Request, res: Response) => {
  register(req, res, RegisterType.PATIENT)
})

export default router;
