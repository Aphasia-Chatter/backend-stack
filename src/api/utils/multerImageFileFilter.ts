import { ALLOW_IMAGE_EXTENSIONS } from "../config/allowedImageFiles";

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
}

