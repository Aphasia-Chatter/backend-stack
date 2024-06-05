import express, { Request, Response } from 'express';
import cors from 'cors';

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';
import staffRoutes from './api/routes/staffRoutes';
import patientRoutes from './api/routes/patientRoutes';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/staff', staffRoutes);
app.use('/api/patient', patientRoutes);


app.get('/api/ping', (req, res) => {
	res.send('Pong!');
  });

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});