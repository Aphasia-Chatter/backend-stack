import { ALLOW_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_MB } from "../config/allowedImageFiles";

/**
 * File filter function to be used with Multer.
 * @param req - Express Request object
 * @param file - Multer File object
 * @param cb - Callback function
 */
export function multerImagefileFilter(req: any, file: any, cb: any): void {
	const allowedExtensions: string[] = ALLOW_IMAGE_EXTENSIONS;
	const fileExtension: string = file.originalname.split('.').pop()?.toLowerCase() || '';

	const isFileTypeAllowed: boolean = allowedExtensions.includes(fileExtension);

	if (isFileTypeAllowed) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'), false);
	}

	if (file.size > 1024 * 1024 * MAX_IMAGE_SIZE_MB) {
		return cb(new Error('File size exceeds the limit'));
	}
}

