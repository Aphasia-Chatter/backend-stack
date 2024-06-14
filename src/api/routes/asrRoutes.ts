import { Router, Request, Response } from 'express';
import { transcribe } from '../services/asr'
import multer from 'multer';
import fs from 'fs'

const router: Router = Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'audios/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${(file.originalname)}`);
    }
});

// Storage engine
const upload = multer({ storage: storage });

// /api/asr/transcribe
router.post('/transcribe', upload.single('audioFile'), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ status: "FAILURE", message: "No file uploaded." });
    }
    transcribe(req, res);
});

export default router