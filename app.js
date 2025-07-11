import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { corrected: null, suggestions: [] });
});

app.post('/correct', async (req, res) => {
  const inputText = req.body.text;

  if (!inputText.trim()) {
    return res.render('index', {
      corrected: '❗ Please enter some text to correct.',
      suggestions: [],
    });
  }

  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: inputText, language: 'en-US' }),
    });

    const data = await response.json();

    let highlighted = '';
    let lastIndex = 0;
    const suggestions = [];

    data.matches.forEach((match) => {
      const replacement = match.replacements[0]?.value || '';
      const before = inputText.slice(lastIndex, match.offset);
      const original = inputText.slice(match.offset, match.offset + match.length);

      highlighted += before;
      if (replacement) {
        highlighted += `<mark class="bg-warning" title="${match.message}">${replacement}</mark>`;
        suggestions.push({ original, suggestion: replacement, message: match.message });
      } else {
        highlighted += original;
      }
      lastIndex = match.offset + match.length;
    });

    highlighted += inputText.slice(lastIndex);

    res.render('index', { corrected: highlighted, suggestions });
  } catch (error) {
    console.error('❌ LanguageTool API error:', error.message);
    res.render('index', {
      corrected: '❌ Error checking grammar. Please try again later.',
      suggestions: [],
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
