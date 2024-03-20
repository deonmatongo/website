require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const OpenAI = require('openai');

const Candidate = require('./schema');

const app = express();

mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/validateCode', async (req, res) => {
    const { uniqueCode, selectedLanguage } = req.body;

    try {
        const candidate = await Candidate.findOne({ id: uniqueCode });

        if (!candidate) {
            return res.json({ valid: false, message: "Invalid code. Please try again." });
        }

        if (candidate.isTestCompleted) {
            return res.json({ valid: false, message: "You have already completed your test." });
        }

        candidate.language = selectedLanguage;
        await candidate.save();
        res.json({ valid: true });
    } catch (error) {
        console.error('Error in /validateCode:', error);
        res.status(500).send('Server error occurred.');
    }
});

app.post('/testCompleted', async (req, res) => {
    const { id } = req.body;

    try {
        const candidate = await Candidate.findOneAndUpdate({ id: id }, { isTestCompleted: true });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json({ message: 'Test completion status updated successfully' });
    } catch (error) {
        console.error('Error in /testCompleted:', error);
        res.status(500).send('Server error occurred.');
    }
});

app.post('/nextQuestion', async (req, res) => {
    const { answer, language, id, title, question, timeSpent } = req.body;

    try {
        const candidate = await Candidate.findOne({ id: id });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const systemPrompt = `AI Evaluator Instructions:
        Review coding ithe Submitted Code for a Senior Developer role. Your task is to assess the submitted code based on the Question, analyse the question and review the answer mentally. Provide a numerical score from 0 to 10, where 10 is properly working code an senior Developer would write,Think this through fully meeting the Question's requirements. Your evaluation should be meticulous, taking into account the following aspects:
        
        - Correctness: Ensure the code correctly implements the solution without errors.
        - If the code will not work give a score between 0 and 3 based on how bad the code is
        - If the code has errors or mistakes but the candidate shows some knowledge of the language give a score between 3 and 5
        - If the code works but the code is poor give a score between 5 and 7
        - If the code works efficiently and is of good quality give a score between 8 and 10
        
        Only the numerical score is required in your output. Take your time to analyze the submission thoroughly to ensure an accurate assessment.
        
        Programming Language: ${language}.
        
        Question:
        ${JSON.stringify(question, null, 2)};
        
        Submitted Code:
        ${JSON.stringify(answer, null, 2)};
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [{ role: "system", content: systemPrompt }],
        });

        const aiResponse = response.choices[0].message.content.trim();
        const score = parseFloat(aiResponse);
        
        if (!isNaN(score)) {
            candidate.scores.push({ 
                score: score, 
                title: title,
                time: `${timeSpent} ms`
            });
            await candidate.save();
            res.json({ message: 'Data received successfully', evaluation: aiResponse });
        } else {
            console.error('AI response did not contain a valid score:', aiResponse);
            res.status(500).send('Server error occurred.');
        }
    } catch (error) {
        console.error('Error in /nextQuestion:', error);
        res.status(500).send('Server error occurred.');
    }
});

app.get('/interviews', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'interview.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'HOME.html'));
});

app.get('/aboutUs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ABOUT-US.html'));
});

app.get('/cookies', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'COOKIES.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PRIVACY-INFORMATION.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'SERVICES.html'));
});

app.get('/disclaimer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LEGAL-DISCLAIMER.html'));
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
