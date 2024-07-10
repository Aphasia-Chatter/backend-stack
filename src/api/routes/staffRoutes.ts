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

import getAllEnrolmentCodes from '../controllers/staff/enrollment/getAllEnrolmentCodes';
import createEnrolmentCode from '../controllers/staff/enrollment/createEnrolmentCode'
import removeEnrolmentCode from '../controllers/staff/enrollment/removeEnrolmentCode';

import getWordRetrievalTaskImages from '../controllers/staff/taskGetter/getWordRetrievalTaskImages';

import selectPatientByUsername from '../repositories/selectPatientByUsername';
import selectPatientByLIKE from '../repositories/selectPatientsByLIKE';
import getAllRelatedPatients from '../controllers/staff/getAllRelatedPatients';
import getNumberOfCompletedAssessments from '../repositories/getNumberOfCompletedAssessments';
import getRecentCompletedAssessments from '../repositories/getRecentCompletedAssessments';
import getRecentActivities from '../repositories/getRecentActivities';

import deleteTask from '../controllers/staff/taskDeletion/deleteTask';
import getWordRetrievalTaskOngoingSessionCount from '../controllers/staff/taskGetter/getWordRetrievalTaskOngoingSessionCount';

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

// /api/staff/get-all-related-patients
router.get('/get-all-related-patients', async (req: Request, res: Response) => {
	getAllRelatedPatients(req, res)
})

router.post('/create-word-retrieval-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
  createTask(req, res, TaskType.WORD_RETREVIAL)
})

// router.put('/modify-word-retrieval-task', multer({ storage: wordRetrevialTaskstorage, fileFilter: multerImagefileFilter }).single('image'), (req: Request, res: Response) => {
// 	console.log("Helloooo")
//   configureTask(req, res, TaskType.WORD_RETREVIAL)	
// })

router.put('/modify-word-retrieval-task', multer().none(), (req: Request, res: Response) => {
  configureTask(req, res, TaskType.WORD_RETREVIAL)	
})

router.get('/get-word-retrieval-task', async (req: Request, res: Response) => {
	getTask(req, res, TaskType.WORD_RETREVIAL)
})

// /api/staff/get-word-retrieval-task-images
router.post('/get-word-retrieval-task-images', async (req: Request, res: Response) => {
	getWordRetrievalTaskImages(req, res)
})

// /api/staff/delete-word-retrieval-task
router.post('/delete-word-retrieval-task', async (req: Request, res: Response) => {
	deleteTask(req, res, TaskType.WORD_RETREVIAL)
})

// /api/staff/get-word-retrieval-task-ongoing-session-count
router.get('/get-word-retrieval-task-ongoing-session-count', async (req: Request, res: Response) => {
	getWordRetrievalTaskOngoingSessionCount(req, res)
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

// /api/staff/filter
router.get('/filter', async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is missing' });
    }

    try {
      const filteredPatients = await selectPatientByLIKE(query as string);
      return res.json(filteredPatients);
    } catch (error) {
      console.error('Error fetching filtered patients:', error);
      return res.status(500).json({ error: 'An error occurred while fetching the filtered patients' });
    }
});

// /api/staff/get_num_assessments_completed
router.get('/get_num_assessments_completed/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  try {
    const count = await getNumberOfCompletedAssessments(patientId, today);
    res.status(200).send({ count });
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching the assessment count' });
  }
});

// /api/staff/get_recent_assessments_completed
router.get('/get_recent_assessments_completed/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const assessments = await getRecentCompletedAssessments(patientId);
    return res.json(assessments);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching the assessments' });
  }
});

// /api/staff/get_recent_activities
router.get('/get_recent_activities/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const activity = await getRecentActivities(patientId);
    return res.json(activity);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching the activities'});
  }
});

//#endregion

export default router;
