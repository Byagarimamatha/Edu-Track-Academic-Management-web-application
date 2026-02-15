const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const sessionsPath = path.join(__dirname, '../votingSessions.json');
const candidatesPath = path.join(__dirname, '../candidates.json');
const votesPath = path.join(__dirname, '../votes.json');

// Helpers
const read = (file) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
};

const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));


// === CREATE SESSION ===
router.post('/create-session', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: 'Session title is required' });

  const sessions = read(sessionsPath);
  const newSession = { id: Date.now().toString(), title, createdAt: new Date() };
  sessions.push(newSession);
  write(sessionsPath, sessions);

  res.json({ message: '✅ Session created', session: newSession });
});


// === GET ALL SESSIONS ===
router.get('/sessions', (req, res) => {
  const sessions = read(sessionsPath);
  res.json(sessions);
});


// === ADD CANDIDATE TO SESSION ===
router.post('/add-candidate', (req, res) => {
  const { sessionId, name } = req.body;
  if (!sessionId || !name) return res.status(400).json({ message: 'Missing sessionId or name' });

  const candidates = read(candidatesPath);
  const newCandidate = { id: Date.now().toString(), sessionId, name };
  candidates.push(newCandidate);
  write(candidatesPath, candidates);

  res.json({ message: '✅ Candidate added', candidate: newCandidate });
});


// === GET CANDIDATES FOR A SESSION ===
router.get('/candidates/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const candidates = read(candidatesPath).filter(c => c.sessionId === sessionId);
  res.json(candidates);
});


// === DELETE CANDIDATE ===
router.delete('/delete-candidate/:id/:sessionId', (req, res) => {
  const { id, sessionId } = req.params;
  let candidates = read(candidatesPath);
  const before = candidates.length;
  candidates = candidates.filter(c => !(c.id === id && c.sessionId === sessionId));
  write(candidatesPath, candidates);

  if (candidates.length === before) {
    return res.status(404).json({ message: '❌ Candidate not found in session' });
  }

  res.json({ message: '🗑️ Candidate deleted' });
});


// === SUBMIT A VOTE ===
router.post('/vote', (req, res) => {
  const { sessionId, candidateId, studentUsername } = req.body;
  if (!sessionId || !candidateId || !studentUsername) {
    return res.status(400).json({ message: 'Missing vote info' });
  }

  const votes = read(votesPath);
  const alreadyVoted = votes.find(v => v.sessionId === sessionId && v.studentUsername === studentUsername);
  if (alreadyVoted) {
    return res.status(400).json({ message: '❌ You already voted in this session' });
  }

  const newVote = { id: Date.now().toString(), sessionId, candidateId, studentUsername };
  votes.push(newVote);
  write(votesPath, votes);

  res.json({ message: '✅ Vote submitted' });
});


// === GET RESULTS FOR A SESSION ===
router.get('/results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const candidates = read(candidatesPath).filter(c => c.sessionId === sessionId);
  const votes = read(votesPath).filter(v => v.sessionId === sessionId);

  const results = candidates.map(c => {
    const count = votes.filter(v => v.candidateId === c.id).length;
    return { candidate: c.name, votes: count };
  });

  res.json(results);
});

module.exports = router;
