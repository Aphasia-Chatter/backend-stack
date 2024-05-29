import express, { Request, Response } from 'express';

import * as argon2 from "argon2";
import * as schema from './schema';
import { db } from './db';

const app = express();
const port = 3000;

app.get('/api/ping', (req: Request, res: Response) => {
	res.send('Pong!');
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);

	db.select().from(schema.staff).then(async (result) => {
		if (result.length >= 1) {
			return;
		}

		const defaultStaffUsername = process.env.DEFAULT_STAFF_USERNAME || 'staff'
		const defaultStaffPassword = process.env.DEFAULT_STAFF_PASSWORD || 'adminadmin'

		const hashPepper = process.env.HASHING_PEPPER

		try {
			const hash = await argon2.hash(defaultStaffPassword + hashPepper);
			await db.insert(schema.staff).values({
				username: defaultStaffUsername,
				hashedPassword: hash
			});

		} catch (err) {
			await db.insert(schema.log).values({
				message: `Failed to create default staff user :: ${err}`,
				severity: "CRITICAL"
			})
		}
	})

});
