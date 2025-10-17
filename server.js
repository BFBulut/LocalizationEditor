const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const { translate } = require('@kreisler/js-google-translate-free');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.post('/translate', async (req, res) => {
  const { text, sourceLang, targetLangs } = req.body;

  if (!text || !sourceLang || !targetLangs || !Array.isArray(targetLangs)) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const translations = {};
    for (const lang of targetLangs) {
      const translatedText = await translate(text, { from: sourceLang, to: lang });
      translations[lang] = translatedText;
    }
    res.json(translations);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate text.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
