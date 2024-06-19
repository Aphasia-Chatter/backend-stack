import { Router, Request, Response } from 'express';

import login, { LoginType } from '../controllers/login';
import register, { RegisterType } from '../controllers/register';
import logout, { LogoutType } from '../controllers/logout';
import deleteAccount, { DeleteAccountType } from '../controllers/deleteAccount';
import changeAccountPassword, { ChangeAccountPasswordType } from '../controllers/changeAccountPassword';
import checkToken from '../controllers/staff/checkToken';

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

// /api/patient/logout
router.post('/logout', (req: Request, res: Response) => {
  logout(req, res, LogoutType.PATIENT)
})

// /api/patient/delete_account
router.post('/delete-account', (req: Request, res: Response) => {
  deleteAccount(req, res, DeleteAccountType.PATIENT)
})

// /api/patient/change_account_password
router.post('/change-account-password', (req: Request, res: Response) => {
  changeAccountPassword(req, res, ChangeAccountPasswordType.PATIENT)
})

export default router;
