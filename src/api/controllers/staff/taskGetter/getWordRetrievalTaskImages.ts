import { Request, Response } from 'express';

import * as path from 'path';
import * as fs from 'fs';

export default async function getStaffWordRetrievalTasksImages(req: Request, res: Response): Promise<void>  {
    const filePaths: string[] = req.body.filePaths;

    if (!Array.isArray(filePaths)) {
        res.status(400).send('filePaths should be an array of strings');
        return;
    }

    const images: { path: string; data: Buffer }[] = [];

    for (const filePath of filePaths) {
        const absolutePath = path.resolve(filePath);

        try {
            await fs.promises.access(absolutePath, fs.constants.F_OK);
            const data = await fs.promises.readFile(absolutePath);
            images.push({ path: filePath, data });
        } catch (err) {
            res.status(404).send(`Image not found: ${filePath}`);
            return;
        }
    }

    // Return the images in JSON format
    res.json(images.map(image => ({
        path: image.path,
        data: image.data.toString('base64') // Convert image buffer to base64 string
    })));
}