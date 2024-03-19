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
  const  systemPrompt= 'your name is amrio'

  async function test(){
  // Call the OpenAI API to evaluate the submission
  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [{ role: "system", content: systemPrompt }],
});

const aiResponse = response.choices[0].message.content.trim();
console.log(aiResponse)
  }

  test()