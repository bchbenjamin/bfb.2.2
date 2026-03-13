import multer from 'multer';
import { logger } from '../utils/logger.js';

// Always use memory storage — Vercel has no writable filesystem
const storage = multer.memoryStorage();

function getExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot);
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      logger.warn(`Upload rejected: unsupported mimetype ${file.mimetype}`, { filename: file.originalname });
      return cb(null, false);
    }
    logger.debug(`Upload accepted: ${file.originalname}`, { mimetype: file.mimetype });
    cb(null, true);
  },
});
