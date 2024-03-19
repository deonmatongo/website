require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const lockFile = require('lockfile');
const util = require('util');
const app = express();
const candidatesFilePath = path.join(__dirname, 'candidates.json');
const lockFilePath = candidatesFilePath + '.lock';
const OpenAI = require("openai");

// Promisify fs and lockfile methods for use with async/await
const lock = util.promisify(lockFile.lock);
const unlock = util.promisify(lockFile.unlock);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

async function updateJsonFile(operation, res) {
    try {
        await lock(lockFilePath, { retries: 10, retryWait: 100 });
        const data = await readFile(candidatesFilePath);
        let candidates = JSON.parse(data);
        const updateResult = operation(candidates);

        if (!updateResult.success) {
            await unlock(lockFilePath);
            return res.json(updateResult.response);
        }

        await writeFile(candidatesFilePath, JSON.stringify(candidates, null, 2));
        await unlock(lockFilePath);
        res.json(updateResult.response);
    } catch (error) {
        console.error('Error in updateJsonFile:', error);
        try {
            await unlock(lockFilePath);
        } catch (unlockError) {
            console.error('Error unlocking the file:', unlockError);
        }
        return res.status(500).send('Server error occurred.');
    }
}

app.post('/validateCode', (req, res) => {
    const uniqueCode = req.body.uniqueCode;
    const selectedLanguage = req.body.selectedLanguage;

    updateJsonFile(candidates => {
        let candidate = candidates.find(c => c.id === uniqueCode);

        if (!candidate) {
            return { success: false, response: { valid: false, message: "Invalid code. Please try again." } };
        }

        if (candidate.isTestCompleted) {
            return { success: false, response: { valid: false, message: "You have already completed your test." } };
        }

        candidate.language = selectedLanguage;
        return { success: true, response: { valid: true } };
    }, res);
});

app.post('/testCompleted', (req, res) => {
    const testData = req.body;

    updateJsonFile(candidates => {
        let candidateIndex = candidates.findIndex(c => c.id === testData.id);
        if (candidateIndex === -1) {
            return { success: false, response: 'Candidate not found' };
        }

        candidates[candidateIndex].isTestCompleted = true;
        return { success: true, response: { message: 'Test completion status updated successfully' } };
    }, res);
});

app.post('/nextQuestion', async (req, res) => {
    const { answer, language, id, title, question, timeSpent } = req.body;

    try {
        // Lock the file to prevent race conditions
        await lock(lockFilePath, { retries: 10, retryWait: 100 });

        // Read and parse the candidates file
        const data = await readFile(candidatesFilePath);
        let candidates = JSON.parse(data);
        let candidate = candidates.find(c => c.id === id);

        if (!candidate) {
            await unlock(lockFilePath);
            return res.status(404).json({ error: 'Candidate not found' });
        }
        // Construct the system prompt for the OpenAI API
        const systemPrompt = `
AI Evaluator Instructions:
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

        // Call the OpenAI API to evaluate the submission
        const response = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [{ role: "system", content: systemPrompt }],
        });

        const aiResponse = response.choices[0].message.content.trim();
        const score = aiResponse 
        if (score !== null) {
            candidate.scores.push({ 
                score: score, 
                title: title,
                time: `${timeSpent} ms`
            });

        } else {
            console.error('AI response did not contain a valid score:', aiResponse);
        }

        // Write the updated candidates back to the file
        await writeFile(candidatesFilePath, JSON.stringify(candidates, null, 2));
        await unlock(lockFilePath);

        res.json({ message: 'Data received successfully', evaluation: aiResponse });
    } catch (error) {
        console.error('Error in nextQuestion:', error);
        try {
            await unlock(lockFilePath);
        } catch (unlockError) {
            console.error('Error unlocking the file:', unlockError);
        }
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
