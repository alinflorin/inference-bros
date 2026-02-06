import http from "http";
import fs from "fs";

// --- GUI HTML ---
const IS_PRODUCTION = process.env.NODE_ENV === "production";
console.log(`Is production: ${IS_PRODUCTION}`);
const PORT = 8080;

let GUI_HTML = 'UI 404';
try {
  GUI_HTML = fs.readFileSync(process.cwd() + '/index.html');
} catch (err) {
  // ignored
  console.warn('No UI file!');
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", service: "generic" }));
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(GUI_HTML);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
