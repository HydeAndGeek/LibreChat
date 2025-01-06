const HybridProcessor = require('../services/hybrid_processor');
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class ProcessingController {
  constructor() {
    this.localProcessor = new HybridProcessor();
    this.mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:3001';
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await this.localProcessor.init();
      await this.checkMediaService();
      this.initialized = true;
    }
  }

  async checkMediaService() {
    try {
      const response = await fetch(`${this.mediaServiceUrl}/health`);
      if (!response.ok) {
        console.warn('Media service health check failed. Some features may be limited.');
      }
    } catch (error) {
      console.warn('Media service not available. Heavy media processing will be limited.');
    }
  }

  async processFile(filePath, options = {}) {
    await this.init();

    const ext = path.extname(filePath).toLowerCase();
    const stats = await fs.stat(filePath);
    const isLargeFile = stats.size > 10 * 1024 * 1024; // 10MB threshold

    // Determine if we should use remote processing
    const useRemote = this.shouldUseRemoteProcessing(ext, isLargeFile);

    try {
      if (useRemote) {
        return await this.processWithMediaService(filePath, ext);
      } else {
        return await this.localProcessor.processDocument(filePath);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  shouldUseRemoteProcessing(ext, isLargeFile) {
    // Video and audio always use remote processing
    if (['.mp4', '.avi', '.mov', '.mp3', '.wav', '.m4a'].includes(ext)) {
      return true;
    }

    // Large images use remote processing
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext) && isLargeFile) {
      return true;
    }

    // Large PDFs use remote processing
    if (ext === '.pdf' && isLargeFile) {
      return true;
    }

    return false;
  }

  async processWithMediaService(filePath, ext) {
    const form = new FormData();
    const fileStream = await fs.readFile(filePath);
    form.append('file', fileStream, { filename: path.basename(filePath) });

    let endpoint;
    if (['.mp4', '.avi', '.mov'].includes(ext)) {
      endpoint = '/process/video';
    } else if (['.mp3', '.wav', '.m4a'].includes(ext)) {
      endpoint = '/process/audio';
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      endpoint = '/process/image';
    } else {
      throw new Error(`Unsupported file type for remote processing: ${ext}`);
    }

    try {
      const response = await fetch(`${this.mediaServiceUrl}${endpoint}`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Media service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing with media service:', error);
      throw error;
    }
  }

  // Process a URL or web content
  async processUrl(url) {
    await this.init();

    // Create a temporary file to store the URL
    const tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'librechat-'));
    const urlFile = path.join(tempDir, 'url.txt');

    try {
      await fs.writeFile(urlFile, url);
      return await this.localProcessor.processDocument(urlFile);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  // Process text content directly
  async processText(text) {
    await this.init();

    const tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'librechat-'));
    const textFile = path.join(tempDir, 'content.txt');

    try {
      await fs.writeFile(textFile, text);
      return await this.localProcessor.processDocument(textFile);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  // Clean up resources
  async cleanup() {
    await this.localProcessor.cleanup();
  }
}

module.exports = new ProcessingController();
