const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const attendanceDataPath = path.join(__dirname, 'attendance.json');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

let currentQRToken = generateQRToken();

// Auto-change QR token every 45 seconds
setInterval(() => {
  currentQRToken = generateQRToken();
}, 45000);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Helper to generate random QR token
function generateQRToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ✅ Serve login page (default route)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});


// ✅ Get latest QR token for student
app.get('/get-latest-qr', (req, res) => {
  res.json({ token: currentQRToken });
});

// ✅ Update QR token manually (optional for teacher screen)
app.post('/update-qr', (req, res) => {
  const { token } = req.body;
  currentQRToken = token;
  res.json({ success: true });
});

// ✅ Submit attendance (QR + GPS + face)
app.post('/submit-attendance', (req, res) => {
  const { qrToken, faceData, latitude, longitude } = req.body;

  if (!qrToken || !faceData) {
    return res.json({ message: '❌ Missing QR or face data.' });
  }

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

  let records = [];
  if (fs.existsSync(attendanceDataPath)) {
    const raw = fs.readFileSync(attendanceDataPath);
    records = JSON.parse(raw);
  }
  records.push(attendanceRecord);
  fs.writeFileSync(attendanceDataPath, JSON.stringify(records, null, 2));

  console.log(`✅ Attendance Marked: ${fileName} from [${latitude}, ${longitude}]`);

  res.json({ message: '✅ Attendance Marked Successfully!' });
});

// ✅ Get all attendance records (for teacher view)
app.get('/get-attendance-records', (req, res) => {
  if (!fs.existsSync(attendanceDataPath)) return res.json([]);
  const raw = fs.readFileSync(attendanceDataPath, 'utf-8');
  const data = JSON.parse(raw);
  res.json(data);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ EDU_TRACK server running at http://localhost:${PORT}`);
});
