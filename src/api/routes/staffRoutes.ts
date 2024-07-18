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
import getRecentCompletedTaskSessions from '../repositories/getRecentCompletedTaskSessions';
import getRecentActivities from '../repositories/getRecentActivities';

import deleteTask from '../controllers/staff/taskDeletion/deleteTask';
import getWordRetrievalTaskOngoingSessionCount from '../controllers/staff/taskGetter/getWordRetrievalTaskOngoingSessionCount';

import getAssessmentDetails from '../repositories/getAssessmentDetails';
import getTimeTaken from '../repositories/getTimeTaken';
import getHintsUsed from '../repositories/getHintsUsed';
import getSuccessPercentage from '../repositories/getSuccessPercentage';
import getTaskMessages from '../repositories/getTaskMessages';
import getSessionIdByTaskId from '../repositories/getSessionIdByTaskId';
import getAnswerStatus from '../repositories/getAnswerStatus';
import insertWordRetrievalSession from '../repositories/insertWordRetrievalTaskSession';
import getRecentActivitySummary from '../repositories/getRecentActivitySummary';

const router: Router = Router();

router.get('/get-assessment-details', async (req: Request, res: Response) => {
  const { patientId, taskId } = req.query;

  try {
    const details = await getAssessmentDetails(patientId as string, taskId as string);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the assessment details' });
  }
});

router.get('/get-time-taken', async (req: Request, res: Response) => {
  const { taskId } = req.query;

  try {
    const timeTaken = await getTimeTaken(taskId as string);
    res.json(timeTaken);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the time taken' });
  }
});

router.get('/get-hints-used', async (req: Request, res: Response) => {
  const { taskId } = req.query;

  try {
    const hintsUsed = await getHintsUsed(taskId as string);
    res.json(hintsUsed);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching hints used' });
  }
});

router.get('/get-success-percentage/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const successPercentage = await getSuccessPercentage(patientId);
    res.json(successPercentage);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the success percentage' });
  }
});

// /api/staff/get-task-messages
router.get('/get-task-messages', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const messages = await getTaskMessages(sessionId as string);
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch task messages' });
  }
});

// /api/staff/get-session-id-by-task-id
router.get('/get-session-id-by-task-id', async (req: Request, res: Response) => {
  const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).send({ error: 'Task ID is required and must be a string' });
  }

  try {
    const sessionId = await getSessionIdByTaskId(taskId as string);
    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the session ID' });
  }
});

router.get('/get-answer-status', async (req: Request, res: Response) => {
  const { taskId } = req.query;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'Task ID is required and must be a string' });
  }

  try {
    const isSuccessful = await getAnswerStatus(taskId as string);
    res.json({ isSuccessful });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the answer status' });
  }
});


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

// /api/staff/get_recent_task_sessions_completed
router.get('/get_recent_task_sessions_completed/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const taskSessions = await getRecentCompletedTaskSessions(patientId);
    return res.json(taskSessions);
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

// /api/staff/recent_activity_summary
router.get('/recent_activity_summary', async (req: Request, res: Response) => {
  getRecentActivitySummary(req, res);
});

//#endregion

export default router;
