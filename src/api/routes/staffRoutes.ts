import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import createTask, { TaskType } from '../controllers/staff/taskCreation/createTask';
import { WORD_RETREVIAL_TASK_ASSETS_DIRECTORY } from '../config/directories';

import login, { LoginType } from '../controllers/login';
import register, { RegisterType } from '../controllers/register';
import logout, { LogoutType } from '../controllers/logout';
import deleteAccount, { DeleteAccountType } from '../controllers/deleteAccount';
import changeAccountPassword, { ChangeAccountPasswordType } from '../controllers/changeAccountPassword';
import checkToken from '../controllers/staff/checkToken';

import { multerImagefileFilter } from '../utils/multerImageFileFilter';
import configureTask from '../controllers/staff/taskConfigure/configureTask';
import getTask from '../controllers/staff/taskGetter/getTask';

import getAllEnrolmentCodes from '../controllers/staff/getAllEnrolmentCodes';
import createEnrolmentCode from '../controllers/staff/createEnrolmentCode'
import removeEnrolmentCode from '../controllers/staff/removeEnrolmentCode';

import selectPatientByUsername from '../repositories/selectPatientByUsername';

const router: Router = Router();

// /api/staff/login
router.post('/login', (req: Request, res: Response) => {
	login(req, res, LoginType.STAFF)
});

// /api/staff/validate-token?username=xxx
router.get('/validate-token', (req: Request, res: Response) => {
	checkToken(req, res)
});

//#region Word Retrevial Tasks
const wordRetrevialTaskstorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, `${WORD_RETREVIAL_TASK_ASSETS_DIRECTORY}/`);
	},
	filename: function (req, file, cb) {
		const extension = file.originalname.split('.').pop();
		const filename = `${uuidv4()}.${extension}`;
		cb(null, filename);
	}
});

// /api/staff/register
router.post('/register', (req: Request, res: Response) => {
  register(req, res, RegisterType.STAFF)
})

// /api/staff/logout
router.post('/logout', (req: Request, res: Response) => {
  logout(req, res, LogoutType.STAFF)
})

// /api/staff/delete-account
router.post('/delete-account', (req: Request, res: Response) => {
  deleteAccount(req, res, DeleteAccountType.STAFF)
})

// /api/staff/change-account-password
router.post('/change-account-password', (req: Request, res: Response) => {
  changeAccountPassword(req, res, ChangeAccountPasswordType.STAFF)
})

// /api/staff/get-all-enrolment-codes
router.get('/get-all-enrolment-codes', async (req: Request, res: Response) => {
	getAllEnrolmentCodes(req, res)
})

// /api/staff/create-enrolment-code
router.post('/create-enrolment-code', (req: Request, res: Response) => {
	createEnrolmentCode(req, res)
})

// /api/staff/remove-existing-enrolment-code
router.post('/remove-existing-enrolment-code', (req: Request, res: Response) => {
	removeEnrolmentCode(req, res)
})

router.post('/create-word-retrevial-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
	createTask(req, res, TaskType.WORD_RETREVIAL)
})

router.put('/modify-word-retrevial-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
	configureTask(req, res, TaskType.WORD_RETREVIAL)	
})

router.get('/get-word-retrevial-task', (req: Request, res: Response) => {
	getTask(req, res, TaskType.WORD_RETREVIAL)
})

// /api/staff/search?username=xxx
router.get('/search', async (req: Request, res: Response) => {
    const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).send({ error: 'Username is required and must be a string' });
  }

  try {
    const patient = await selectPatientByUsername(username);
    if (patient.length === 0) {
      return res.status(404).send({ error: 'Patient not found' });
    }
    res.status(200).send(patient);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching the patient' });
  }
  });


//#endregion

export default router;
