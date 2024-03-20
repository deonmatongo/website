// models/Candidate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const candidateSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    id: {
        type: String,
        required: true,
        unique: true
    },
    isTestCompleted: {
        type: Boolean,
        default: false
    },
    overallScore: {
        type: Number,
        default: 0
    },
    scores: [{
        score: { type: Number, required: true },
        title: { type: String, required: true },
        time: { type: String, required: true }
    }]
});

const Candidate = mongoose.model('candidates', candidateSchema);

module.exports = Candidate;
