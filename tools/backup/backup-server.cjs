// Fish & Wish – lokales Firestore-Backup (nur lesend).
// Startet eine kleine Seite auf http://localhost:5055. Dort mit Google anmelden,
// die Seite liest alle Haushaltsdaten und dieser Server speichert sie als JSON.
//
// Aufruf: node tools/backup/backup-server.cjs [Zielordner] [Port]
// Standard-Zielordner: ./backups (ist in .gitignore – Backups NIE committen, das Repo ist öffentlich!)
const http = require('http');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(process.argv[2] || path.join(repoRoot, 'backups'));
const port = Number(process.argv[3] || 5055);
const config = fs.readFileSync(path.join(repoRoot, 'firebase-applet-config.json'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'backup.html'), 'utf8').replace('__CONFIG__', config);

http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        JSON.parse(body);
        fs.mkdirSync(outDir, { recursive: true });
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const file = path.join(outDir, `firestore-backup-${stamp}.json`);
        fs.writeFileSync(file, body, 'utf8');
        console.log('Gespeichert:', file);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ file }));
      } catch (e) {
        res.writeHead(400); res.end(String(e.message));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1', () => {
  console.log(`Backup-Seite: http://localhost:${port}`);
  console.log(`Zielordner:   ${outDir}`);
});
