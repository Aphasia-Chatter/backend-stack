import express, { Request, Response } from 'express';
import cors from 'cors';

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';
import staffRoutes from './api/routes/staffRoutes';

const app = express();
const port = 3000;

// Added to resolve CORS issue
const corsOptions = {
	origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/staff', staffRoutes);


app.get('/api/ping', (req, res) => {
	res.send('Pong!');
  });

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});
