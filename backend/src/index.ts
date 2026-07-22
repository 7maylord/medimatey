// MediMate backend — Phase-B caregiver relay.
// ponytail: zero-dep node:http stub; pick a framework when Phase B is validated
// (push subscriptions, caregiver share links, missed-dose alerts — see docs/briefs/).
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4000);

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "medimate-backend", ts: new Date().toISOString() }));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`medimate-backend listening on http://localhost:${PORT}`);
});
