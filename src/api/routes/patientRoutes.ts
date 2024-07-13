import { Router, Request, Response } from 'express';

import login, { LoginType } from '../controllers/login';
import register, { RegisterType } from '../controllers/register';
import logout, { LogoutType } from '../controllers/logout';
import deleteAccount, { DeleteAccountType } from '../controllers/deleteAccount';
import changeAccountPassword, { ChangeAccountPasswordType } from '../controllers/changeAccountPassword';
import checkToken from '../controllers/staff/checkToken';
import getPatientWordRetrievalTasks from '../controllers/patient/getPatientWordRetrievalTasks';
import createWordRetrievalTaskSession from '../controllers/patient/createWordRetrievalTaskSession';

import getPatientWordRetrievalTaskImage from '../controllers/patient/getPatientWordRetrievalTaskImage'
import chatOnSession from '../controllers/patient/chatOnSession';
import getChatSessionHistory from '../controllers/patient/getChatSessionHistory';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';
import chatAudioOnSession from '../controllers/patient/chatAudioOnSession';
import getPatientWordRetrievalTaskById from '../controllers/patient/getPatientWordRetrievalTaskById';

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

// /api/patient/delete-account
router.post('/delete-account', (req: Request, res: Response) => {
  deleteAccount(req, res, DeleteAccountType.PATIENT)
})

// /api/patient/change-account-password
router.post('/change-account-password', (req: Request, res: Response) => {
  changeAccountPassword(req, res, ChangeAccountPasswordType.PATIENT)
})

// /api/patient/get-word-retrieval-task
router.get('/get-word-retrieval-task', async (req: Request, res: Response) => {
  getPatientWordRetrievalTasks(req, res)
})

// /api/patient/create-word-retrieval-task-session
router.post('/create-word-retrieval-task-session', async (req: Request, res: Response) => {
  createWordRetrievalTaskSession(req, res)
})

// /api/patient/get-word-retrieval-task-image
router.get('/get-word-retrieval-task-image', async (req: Request, res: Response) => {
  getPatientWordRetrievalTaskImage(req, res)
})

// /api/patient/get-word-retrieval-task-by-id
router.get('/get-word-retrieval-task-by-id', async (req: Request, res: Response) => {
  getPatientWordRetrievalTaskById(req, res)
})

/**
 * POST /api/patient/chat-session
 * 
 * @param {string} username
 * @param {string} sessionToken
 * @param {string} taskSessionID (ID of the task session to target)
 * @param {string} content (User sent content)
 * 
 * @returns {
 *  'status': Success expected,
 *  'message': Message related to status,
 *  'data': {
 *    'botMessageID': ID of the inserted bot message,
 *    'userMessageID': ID of the inserted user message,
 *    'message': Message of the bot,
 *    'completed': True if the session was completed from the given message
 *    'isCorrectAnswer': True if the message given was the correct answer
 *  }
 * }
 * 
 * 'data' will be empty if status is not success
 */
router.post('/chat-session', async (req: Request, res: Response) => {
  chatOnSession(req, res)
})

// Set up multer for file uploads
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'audios/');
  },
  filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${(file.originalname)}`);
  }
});

// Storage engine
const audioUpload = multer({ storage: audioStorage });

/**
 * POST /api/patient/chat-session-audio
 * 
 * @param {string} username
 * @param {string} sessionToken
 * @param {string} taskSessionID (ID of the task session to target)
 * @param {string} audioFile (Actual audio file itself, same as asr)
 * 
 * @returns {
*  'status': Success expected,
*  'message': Message related to status,
*  'data': {
*    'botMessageID': ID of the inserted bot message,
*    'userMessageID': ID of the inserted user message,
*    'message': Message of the bot
*    'completed': True if the session was completed from the given message
*    'isCorrectAnswer': True if the message given was the correct answer.
*  }
* }
* 
* 'data' will be empty if status is not success
* TODO: Edit multer to validate audio file.
*/
router.post('/chat-session-audio', audioUpload.single('audioFile'), async (req: Request, res: Response) => {
  chatAudioOnSession(req, res)
})

/**
 * POST /api/patient/chat-histories
 * 
 * @param {string} username
 * @param {string} sessionToken
 * @param {string} taskSessionID (ID of the task session to target)
 * 
 * @returns {
*  'status': Success expected,
*  'message': Message related to status,
*  'data': {
*    'messages': List of object representing messages
*  }
* }
* 
* Each object in 'messages' contain:
* id
* author
* timestamp: string, compatiable to init a Date object.
* content: string
* hasAudio: boolean, true if this message has audio content
* 
* 'data' will be empty if status is not success
*/
router.post('/chat-histories', async (req: Request, res: Response) => {
  getChatSessionHistory(req, res)
})

export default router;
