import { Request, Response } from 'express';

import * as path from 'path';
import * as fs from 'fs';

export default async function getPatientWordRetrievalTaskImage(req: Request, res: Response): Promise<void> {
    const filePath = req.query.filePath;

    // TODO: Validate filepath to prevent Injection.
    if (typeof filePath !== 'string') {
        res.status(400).send('filePath should be a string');
        return;
    }

    const absolutePath = path.resolve(filePath);

    try {
        await fs.promises.access(absolutePath, fs.constants.F_OK);
        const data = await fs.promises.readFile(absolutePath);
        // Return the image in JSON format
        res.json({
            path: filePath,
            data: data.toString('base64') // Convert image buffer to base64 string
        });
    } catch (err) {
        res.status(404).send(`Image not found: ${filePath}`);
    }
}