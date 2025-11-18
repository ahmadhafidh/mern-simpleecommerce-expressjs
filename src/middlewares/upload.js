import multer from "multer";
import path from "path"


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + ext);
  }
});

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

const imageFileFilter = (req, file, cb) => {
  // cek mimetype
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'), false);
  }

  // cek ekstensi (case-insensitive)
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error('Only image files are allowed (invalid extension).'), false);
  }

  // all good
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // optional: 2 MB limit
});

export { upload };