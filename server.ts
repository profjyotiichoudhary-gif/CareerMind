import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

// @ts-ignore
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared database connection
let _db: any = null;
function getDb() {
  if (!_db) {
    _db = new Database('career.db');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        raw_text TEXT,
        skills TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS career_recommendations (
        id TEXT PRIMARY KEY,
        resume_id TEXT NOT NULL,
        recommended TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resume_id) REFERENCES resumes(id)
      );
      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return _db;
}

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }

  // Use a faster health check
  app.get('/api/health', (req, res) => {
    res.status(200).send('OK');
  });

  // API Routes
  app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
    const filePath = req.file?.path;
    try {
      if (!req.file || !filePath) {
        console.error('[Upload] No file provided in request');
        return res.status(400).json({ error: 'No file provided' });
      }

      console.log(`[Upload] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

      const dataBuffer = fs.readFileSync(filePath);
      console.log('[Upload] Buffer read, starting extraction...');
      
      let rawText = '';
      try {
        // PDFParse version 2.x class-based API
        const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
        const result = await parser.getText();
        rawText = result.text;
        await parser.destroy();
      } catch (parseErr: any) {
        console.error('[Upload] PDFParse v2 failed:', parseErr.message);
        throw new Error(`PDF Parsing failed: ${parseErr.message}`);
      }

      console.log(`[Upload] Extraction successful. Text length: ${rawText?.length || 0}`);

      if (!rawText || rawText.trim().length < 10) {
        console.warn('[Upload] Extracted text too short or empty');
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(422).json({ error: 'Unreadable PDF content' });
      }

      const resumeId = uuidv4();
      const dbInstance = getDb();
      dbInstance.prepare('INSERT INTO resumes (id, filename, raw_text) VALUES (?, ?, ?)').run(resumeId, req.file.originalname, rawText);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.log('[Upload] Success. Resume stored with ID:', resumeId);
      res.status(201).json({ resume_id: resumeId, raw_text: rawText });
    } catch (error: any) {
      console.error('[Upload] Server error:', error);
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      res.status(500).json({ 
        error: 'Server error processing file', 
        details: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  });

  app.get('/api/resume/:id', (req, res) => {
    try {
      const resume = getDb().prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);
      if (!resume) return res.status(404).json({ error: 'Not found' });
      resume.skills = resume.skills ? JSON.parse(resume.skills) : [];
      res.json(resume);
    } catch (e) { res.status(500).send(); }
  });

  app.patch('/api/resume/:id', (req, res) => {
    try {
      getDb().prepare('UPDATE resumes SET skills = ? WHERE id = ?').run(JSON.stringify(req.body.skills), req.params.id);
      res.json({ success: true });
    } catch (e) { res.status(500).send(); }
  });

  app.post('/api/recommend/save', (req, res) => {
    try {
      const id = uuidv4();
      getDb().prepare('INSERT INTO career_recommendations (id, resume_id, recommended) VALUES (?, ?, ?)').run(id, req.body.resume_id, JSON.stringify(req.body.recommended));
      res.json({ id });
    } catch (e) { res.status(500).send(); }
  });

  app.get('/api/chat/history/:session_id', (req, res) => {
    try {
      const rows = getDb().prepare('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at ASC').all(req.params.session_id);
      res.json({ session_id: req.params.session_id, messages: rows, total: rows.length });
    } catch (e) { res.status(500).send(); }
  });

  app.post('/api/chat/message', (req, res) => {
    try {
      const id = uuidv4();
      getDb().prepare('INSERT INTO chat_history (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(id, req.body.session_id, req.body.role, req.body.content);
      res.json({ id });
    } catch (e) { res.status(500).send(); }
  });

  app.delete('/api/chat/history/:session_id', (req, res) => {
    try {
      getDb().prepare('DELETE FROM chat_history WHERE session_id = ?').run(req.params.session_id);
      res.json({ message: 'Cleared' });
    } catch (e) { res.status(500).send(); }
  });

  // Vite setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server optimized and running on port ${PORT}`);
  });
}

startServer();
