const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const processingController = require('../controllers/processingController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Process a file
router.post('/file', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await processingController.processFile(req.file.path);
    await fs.unlink(req.file.path); // Clean up uploaded file
    res.json(result);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process a URL
router.post('/url', express.json(), async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const result = await processingController.processUrl(url);
    res.json(result);
  } catch (error) {
    console.error('Error processing URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process text content
router.post('/text', express.json(), async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  try {
    const result = await processingController.processText(text);
    res.json(result);
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get processing service status
router.get('/status', async (req, res) => {
  try {
    await processingController.init();
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error checking processing service:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
