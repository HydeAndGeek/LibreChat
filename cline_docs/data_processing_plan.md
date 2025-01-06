# Data Processing Implementation Plan

## Architecture Overview

### Local Components (Resource-Light)
1. Document Processing
   - Use llama_index's SimpleDirectoryReader for most document types
   - BeautifulSoup for HTML parsing
   - Playwright for JavaScript-heavy sites
   - youtube-dl for video metadata and transcripts

2. Text Processing
   - SentenceSplitter from llama_index for text chunking
   - Built-in RAG pipeline for data handling
   - Local vector storage with pgvector

### Railway Components (Resource-Intensive)
1. Media Processing Service
   - Video content analysis
   - Audio transcription
   - Image-to-text conversion
   - Deployed as a separate microservice

## Implementation Steps

1. Phase 1: Local Setup
   ```python
   from llama_index.core import SimpleDirectoryReader
   from llama_index.core.node_parser import SentenceSplitter
   from bs4 import BeautifulSoup
   from playwright.sync_api import sync_playwright
   import youtube_dl

   class HybridProcessor:
       def __init__(self):
           self.transformations = [SentenceSplitter()]
           self.file_extractor = self._get_file_extractor()

       def _get_file_extractor(self):
           return {
               # Built-in handlers for common file types
               ".txt": SimpleDirectoryReader(),
               ".pdf": SimpleDirectoryReader(),
               ".docx": SimpleDirectoryReader(),
               # Custom handlers for web content
               ".html": self._html_handler,
               ".js": self._js_handler,
               ".video": self._video_handler
           }
   ```

2. Phase 2: Railway Service
   ```python
   # media_service/main.py
   from fastapi import FastAPI, File, UploadFile
   import pytesseract
   from PIL import Image

   app = FastAPI()

   @app.post("/process/image")
   async def process_image(file: UploadFile):
       image = Image.open(file.file)
       text = pytesseract.image_to_string(image)
       return {"text": text}

   @app.post("/process/video")
   async def process_video(file: UploadFile):
       # Video processing logic
       pass

   @app.post("/process/audio")
   async def process_audio(file: UploadFile):
       # Audio processing logic
       pass
   ```

3. Phase 3: Integration
   ```python
   class DataProcessor:
       def __init__(self):
           self.local_processor = HybridProcessor()
           self.remote_processor = MediaServiceClient()

       async def process_document(self, file_path: str):
           # Route to appropriate processor based on file type
           if file_path.endswith((".mp4", ".mp3", ".wav")):
               return await self.remote_processor.process(file_path)
           return self.local_processor.process(file_path)
   ```

## Configuration

1. Local Settings
   ```yaml
   processing:
     max_chunk_size: 1000
     concurrent_tasks: 3
     cache_dir: "./cache"

   vector_store:
     type: "pgvector"
     connection: "postgresql://user:pass@localhost:5432/vectors"
   ```

2. Railway Settings
   ```yaml
   media_service:
     url: "https://your-railway-app.railway.app"
     max_file_size: "100MB"
     timeout: 300
   ```

## Benefits
1. Resource Efficiency
   - Heavy processing offloaded to Railway
   - Local system handles lightweight tasks
   - Caching for improved performance

2. Scalability
   - Media processing can scale independently
   - Local processing stays responsive
   - Easy to add new processors

3. Maintainability
   - Clear separation of concerns
   - Independent deployment cycles
   - Simplified error handling

## Next Steps
1. Implement local document processors
2. Set up Railway service
3. Create integration layer
4. Add error handling and retries
5. Implement caching
6. Add monitoring and logging
