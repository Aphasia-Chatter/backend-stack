import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.get('/api/ping', (req: Request, res: Response) => {
	res.send('Pong!');
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
