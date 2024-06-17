import express from 'express';
import fs from 'fs'

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';
import staffRoutes from './api/routes/staffRoutes';
import asrRoutes from './api/routes/asrRoutes';
import verifyRoutes from './api/routes/verifyRoutes';

import path from 'path';
import { dirname } from 'path';
import { WORD_RETREVIAL_TASK_ASSETS_DIRECTORY } from './api/config/directories';

import generateCueRoutes from './api/routes/generateCueRoutes';

const app = express();

/*
	Middleware that converts the body of any request to 
	JSON format.
*/
app.use(express.json()); 

const port = 3000;

const requiredDirectories = ['audios', WORD_RETREVIAL_TASK_ASSETS_DIRECTORY];
initalizeUploadDirectories(requiredDirectories);

app.use('/api/generate-cue', generateCueRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/asr', asrRoutes)
app.use('/api/verify', verifyRoutes)

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});


/**
 * Initializes the specified directories if they do not already exist.
 *
 * @param {string[]} directories - An array of directory paths to initialize.
 */
function initalizeUploadDirectories(directories: string[]) {
	const __dirname = dirname('');
	
	for (const directory of directories) {
		const uploadDir = path.join(__dirname, directory);
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir);
		}
	}
}