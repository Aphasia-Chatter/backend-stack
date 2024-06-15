import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import createTask, { TaskType } from '../controllers/staff/taskCreation/createTask';
import { WORD_RETREVIAL_TASK_ASSETS_DIRECTORY } from '../config/directories';
import checkToken from '../controllers/staff/checkToken';
import login, { LoginType } from '../controllers/login';
import { multerImagefileFilter } from '../utils/multerImageFileFilter';
import configureTask from '../controllers/staff/taskConfigure/configureTask';
import getTask from '../controllers/staff/taskGetter/getTask';

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


router.post('/create-word-retrevial-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
	createTask(req, res, TaskType.WORD_RETREVIAL)
})

router.put('/modify-word-retrevial-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
	configureTask(req, res, TaskType.WORD_RETREVIAL)	
})

router.get('/get-word-retrevial-task', (req: Request, res: Response) => {
	getTask(req, res, TaskType.WORD_RETREVIAL)
})
//#endregion

export default router;
