import { createApp } from "./app.ts";
import { startScheduler } from "./services/scheduler.ts";
import { config } from "./config.ts";

const app = createApp();
app.listen(config.port, () => {
  console.log(`medimate-backend listening on http://localhost:${config.port}`);
  startScheduler();
});
