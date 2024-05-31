import express, { Request, Response } from 'express';

import createDefaultStaffIfNoneExists from './api/utils/createDefaultStaffIfNoneExists';
import insertLog from './api/repositories/insertLog';
import staffRoutes from './api/routes/staffRoutes';
import patientRoutes from './api/routes/patientRoutes';

const app = express();
app.use(express.json());

const port = 3000;

// STAFF
app.use('/api/staff', staffRoutes);
app.use('/api/patient', patientRoutes);

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	createDefaultStaffIfNoneExists().catch((err) => {
        insertLog(`Failed to create default staff user :: ${err}`, "CRITICAL")
	})
});