const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const voteRoutes = require('./routes/voteRoutes');


const app = express();
const PORT = 3000;

// Paths
const attendanceDataPath = path.join(__dirname, 'attendance.json');
const quizDataPath = path.join(__dirname, 'quizzes.json');
const scoreDataPath = path.join(__dirname, 'scores.json');
const notifDataPath = path.join(__dirname, 'notifications.json');
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
const teacherLoginPath = path.join(__dirname, 'teacherlogin.json');
const studentLoginPath = path.join(__dirname, 'studentlogin.json');



// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Helper functions
function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// QR token generation
function generateQRToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

let currentQRToken = generateQRToken();
setInterval(() => currentQRToken = generateQRToken(), 45000);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/api/vote', voteRoutes);


// === Static Pages ===
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'attendance', 'public', 'student.html')));
app.get('/attendance', (req, res) => res.sendFile(path.join(publicDir, 'attendance', 'public', 'attendance.html')));
app.get('/attendance/qr-display', (req, res) => res.sendFile(path.join(publicDir, 'attendance', 'public', 'qr_display.html')));
app.get('/attendance/teacher', (req, res) => res.sendFile(path.join(publicDir, 'attendance', 'public', 'teacher.html')));
app.get('/attendance/student', (req, res) => res.sendFile(path.join(publicDir, 'attendance', 'public', 'student.html')));

// === Attendance Routes ===
app.get('/get-latest-qr', (req, res) => res.json({ token: currentQRToken }));

app.post('/update-qr', (req, res) => {
  const { token } = req.body;
  if (token) {
    currentQRToken = token;
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Token is required" });
  }
});

app.post('/submit-attendance', (req, res) => {
  const { qrToken, faceData, latitude, longitude } = req.body;
  if (!qrToken || !faceData) return res.json({ message: '❌ Missing QR or face data.' });

  if (qrToken !== currentQRToken) {
    return res.json({ message: '❌ Invalid QR Code. Please scan the current one from teacher screen.' });
  }

  const imgBuffer = Buffer.from(faceData.split(',')[1], 'base64');
  const fileName = `face_${Date.now()}.jpg`;
  const savePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(savePath, imgBuffer);

  const attendanceRecord = {
    imagePath: `/uploads/${fileName}`,
    qrToken,
    latitude,
    longitude,
    timestamp: new Date().toLocaleString()
  };

  const records = readJSON(attendanceDataPath);
  records.push(attendanceRecord);
  writeJSON(attendanceDataPath, records);

  console.log(`✅ Attendance Marked: ${fileName} from [${latitude}, ${longitude}]`);
  res.json({ message: '✅ Attendance Marked Successfully!' });
});

app.get('/get-attendance-records', (req, res) => {
  const data = readJSON(attendanceDataPath);
  res.json(data);
});

// === Quiz Routes ===
app.get('/api/quizzes', (req, res) => {
  const quizzes = readJSON(quizDataPath);
  res.json(quizzes);
});

app.post('/api/quizzes', (req, res) => {
  const newQuiz = req.body;
  const quizzes = readJSON(quizDataPath);
  quizzes.push(newQuiz);
  writeJSON(quizDataPath, quizzes);
  res.json({ message: "✅ Quiz saved!" });
});

app.put('/api/quizzes', (req, res) => {
  const updatedQuizzes = req.body;
  if (!Array.isArray(updatedQuizzes)) {
    return res.status(400).json({ message: '❌ Invalid data format' });
  }

  writeJSON(quizDataPath, updatedQuizzes);
  res.json({ message: '✅ Quiz list updated.' });
});

// === Scores Routes ===
app.get('/api/scores', (req, res) => {
  const scores = readJSON(scoreDataPath);
  res.json(scores);
});

app.post('/api/scores', (req, res) => {
  const newScore = req.body;
  const scores = readJSON(scoreDataPath);
  scores.push(newScore);
  writeJSON(scoreDataPath, scores);
  res.json({ message: "✅ Score saved!" });
});


// === Notification Routes ===
app.get('/api/notifications', (req, res) => {
  const data = readJSON(notifDataPath);
  res.json(data);
});

app.post('/api/notifications', (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: '❌ Title and message required.' });

  const data = readJSON(notifDataPath);
  const newNotif = { id: Date.now(), title, message };
  data.push(newNotif);
  writeJSON(notifDataPath, data);
  res.json({ message: '✅ Notification added.', data: newNotif });
});

app.put('/api/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let data = readJSON(notifDataPath);
  data = data.map(n => n.id === id ? { ...n, ...req.body } : n);
  writeJSON(notifDataPath, data);
  res.json({ message: "✅ Notification updated." });
});

app.delete('/api/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let data = readJSON(notifDataPath);
  data = data.filter(n => n.id !== id);
  writeJSON(notifDataPath, data);
  res.json({ message: "🗑️ Notification deleted." });
});



// ===== SCORES ROUTE =====
const scoresPath = path.join(__dirname, 'scores.json');
app.get('/api/scores', (req, res) => {
  if (!fs.existsSync(scoresPath)) return res.json([]);
  const raw = fs.readFileSync(scoresPath);
  try {
    const scores = JSON.parse(raw);
    res.json(scores);
  } catch {
    res.json([]);
  }
});

// ===== NOTIFICATIONS ROUTES =====
const notifPath = path.join(__dirname, 'notifications.json');

// GET all notifications
app.get('/api/notifications', (req, res) => {
  if (!fs.existsSync(notifPath)) return res.json([]);
  const raw = fs.readFileSync(notifPath);
  try {
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.json([]);
  }
});

// POST new notification
app.post('/api/notifications', (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: '❌ Title and message required.' });

  const notifications = fs.existsSync(notifPath)
    ? JSON.parse(fs.readFileSync(notifPath)) : [];

  const newNotif = {
    id: Date.now(),
    title,
    message
  };

  notifications.push(newNotif);
  fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 2));
  res.json({ message: '✅ Notification added.', data: newNotif });
});

// PUT update notification
app.put('/api/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, message } = req.body;

  let notifs = fs.existsSync(notifPath)
    ? JSON.parse(fs.readFileSync(notifPath)) : [];

  const index = notifs.findIndex(n => n.id === id);
  if (index === -1) return res.status(404).json({ message: '❌ Not found.' });

  notifs[index] = { ...notifs[index], title, message };
  fs.writeFileSync(notifPath, JSON.stringify(notifs, null, 2));
  res.json({ message: '✅ Notification updated.' });
});

// DELETE notification
app.delete('/api/notifications/:id', (req, res) => {
  const id = parseInt(req.params.id);

  let notifs = fs.existsSync(notifPath)
    ? JSON.parse(fs.readFileSync(notifPath)) : [];

  const updated = notifs.filter(n => n.id !== id);
  fs.writeFileSync(notifPath, JSON.stringify(updated, null, 2));
  res.json({ message: '🗑️ Notification deleted.' });
});


// === Login check routes ===
app.post('/api/login/teacher', (req, res) => {
  
  const { username, password } = req.body;

  console.log("👤 Teacher Login Attempt:");
  console.log("📨 Received:", { username, password });
  const teachers = readJSON(teacherLoginPath);
  const found = teachers.find(t => t.username === username && t.password === password);
  if (found) res.json({ success: true });
  else res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/login/student', (req, res) => {
  const { username, password } = req.body;
  const students = readJSON(studentLoginPath);
  const found = students.find(s => s.username === username && s.password === password);
  if (found) res.json({ success: true });
  else res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// === Admin user management ===
app.get('/api/admin/students', (req, res) => {
  res.json(readJSON(studentLoginPath));
});

app.get('/api/admin/teachers', (req, res) => {
  res.json(readJSON(teacherLoginPath));
});

app.post('/api/admin/students', (req, res) => {
  const students = readJSON(studentLoginPath);
  students.push(req.body);
  writeJSON(studentLoginPath, students);
  res.json({ message: '✅ Student added.' });
});

app.post('/api/admin/teachers', (req, res) => {
  const teachers = readJSON(teacherLoginPath);
  teachers.push(req.body);
  writeJSON(teacherLoginPath, teachers);
  res.json({ message: '✅ Teacher added.' });
});

app.put('/api/admin/students', (req, res) => {
  const { username, password } = req.body;
  let students = readJSON(studentLoginPath);
  students = students.map(s => s.username === username ? { username, password } : s);
  writeJSON(studentLoginPath, students);
  res.json({ message: '✅ Student password updated.' });
});

app.put('/api/admin/teachers', (req, res) => {
  const { username, password } = req.body;
  let teachers = readJSON(teacherLoginPath);
  teachers = teachers.map(t => t.username === username ? { username, password } : t);
  writeJSON(teacherLoginPath, teachers);
  res.json({ message: '✅ Teacher password updated.' });
});

// DELETE student
app.delete('/api/students/:username', (req, res) => {
  const username = req.params.username;
  let data = readJSON(studentLoginPath);
  const updated = data.filter(s => s.username !== username);
  if (updated.length === data.length) {
    return res.status(404).json({ message: '❌ Student not found.' });
  }
  writeJSON(studentLoginPath, updated);
  res.json({ message: '🗑️ Student deleted.' });
});

// DELETE teacher
app.delete('/api/teachers/:username', (req, res) => {
  const username = req.params.username;
  let data = readJSON(teacherLoginPath);
  const updated = data.filter(t => t.username !== username);
  if (updated.length === data.length) {
    return res.status(404).json({ message: '❌ Teacher not found.' });
  }
  writeJSON(teacherLoginPath, updated);
  res.json({ message: '🗑️ Teacher deleted.' });
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ EDU_TRACK server running at http://localhost:${PORT}`);
});
