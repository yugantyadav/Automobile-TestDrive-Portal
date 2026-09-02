const path = require('path');
const fs = require('fs');
const express = require(path.join(__dirname, 'backend/node_modules/express'));
const cors = require(path.join(__dirname, 'backend/node_modules/cors'));

const app = express();
const PORT = 3000;
app.use(cors());
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  const filePath = path.join(frontendPath, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return res.sendFile(filePath);
  const htmlPath = path.join(frontendPath, req.path + '.html');
  if (fs.existsSync(htmlPath)) return res.sendFile(htmlPath);
  // For SPA hash routes like /dashboard#contact, serve requested html if exists without hash
  const cleanPath = req.path.split('#')[0].split('?')[0];
  const cleanHtml = path.join(frontendPath, cleanPath + '.html');
  if (fs.existsSync(cleanHtml)) return res.sendFile(cleanHtml);
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.listen(PORT, () => console.log(`Frontend ATDP running on http://localhost:${PORT}`));
