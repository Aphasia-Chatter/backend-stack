import express, { Request, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import fs from 'fs'

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';
import staffRoutes from './api/routes/staffRoutes';
import asrRoutes from './api/routes/asrRoutes';

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();

/*
	Middleware that converts the body of any request to 
	JSON format.
*/
app.use(express.json()); 

const port = 3000;
const __dirname = dirname(''); // Root path

// Ensure that the 'uploads' directory exists, if not, create one at root
const uploadDir = path.join(__dirname, 'audios');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

app.use('/api/staff', staffRoutes);
app.use('/api/asr', asrRoutes)

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});