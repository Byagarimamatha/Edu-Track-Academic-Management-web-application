const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: String,
  branch: String,
  year: String
});

module.exports = mongoose.model('Candidate', candidateSchema);
