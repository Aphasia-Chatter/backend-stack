import { Router, Request, Response } from 'express';
import login, { LoginType } from '../controllers/login';
import register, { RegisterType } from '../controllers/register';
import logout, { LogoutType } from '../controllers/logout';
import deleteAccount, { DeleteAccountType } from '../controllers/deleteAccount';
import changeAccountPassword, { ChangeAccountPasswordType } from '../controllers/changeAccountPassword';
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

// /api/staff/register
router.post('/register', (req: Request, res: Response) => {
  register(req, res, RegisterType.STAFF)
})

// /api/staff/logout
router.post('/logout', (req: Request, res: Response) => {
  logout(req, res, LogoutType.STAFF)
})

// /api/staff/delete_account
router.post('/delete-account', (req: Request, res: Response) => {
  deleteAccount(req, res, DeleteAccountType.STAFF)
})

// /api/staff/change_account_password
router.post('/change-account-password', (req: Request, res: Response) => {
  changeAccountPassword(req, res, ChangeAccountPasswordType.STAFF)
})

export default router;
