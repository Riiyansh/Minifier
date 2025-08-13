const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { minify: terserMinify } = require('terser');
const CleanCSS = require('clean-css');
const { minify: htmlMinify } = require('html-minifier-terser');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

app.post('/minify', async (req, res) => {
  const { code, type } = req.body;
  if (typeof code !== 'string' || !type) {
    return res.status(400).json({ error: 'Provide "code" (string) and "type" (js|css|html)' });
  }

  try {
    let result = '';
    if (type === 'js') {
      const out = await terserMinify(code, {
        ecma: 2018,
        compress: true,
        mangle: true
      });
      result = out.code || '';
    } else if (type === 'css') {
      result = new CleanCSS({}).minify(code).styles;
    } else if (type === 'html') {
      result = await htmlMinify(code, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true
      });
    } else {
      return res.status(400).json({ error: 'Invalid type. Use js, css, or html.' });
    }

    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(result, 'utf8');

    res.json({
      minified: result,
      originalSize,
      minifiedSize
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Minification failed' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Minifier API running on http://localhost:${PORT}`);
});
