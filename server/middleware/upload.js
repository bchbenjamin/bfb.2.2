import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = process.env.NODE_ENV === 'production'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${getExt(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

function getExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot);
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});
