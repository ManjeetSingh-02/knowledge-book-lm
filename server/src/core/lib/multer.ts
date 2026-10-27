// import external modules
import multer from 'multer';

// sub-function to validate file type
const fileFilter: NonNullable<multer.Options['fileFilter']> = (_, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Invalid file type. Only PDF files are allowed.'));
};

// function to upload file to memory storage
export const uploadPDF = multer({
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage(),
}).single('file');
