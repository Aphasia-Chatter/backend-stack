import express, { Request, Response } from 'express';

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';

const app = express();
const port = 3000;

app.get('/api/ping', (req: Request, res: Response) => {
	res.send('Pong!');
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});
