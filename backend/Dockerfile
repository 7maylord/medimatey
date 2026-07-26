# Always-on container for the caregiver relay (Render / Railway / Fly / any VPS).
# NOT for Vercel serverless — the scheduler needs a persistent process.
FROM node:22-alpine
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY . .

ENV NODE_ENV=production
# Persist the JSON store on a mounted volume so data survives restarts/redeploys.
ENV DATA_FILE=/data/data.json
EXPOSE 4000

# Node 22 runs the TypeScript entry directly (type stripping); no build step.
CMD ["node", "src/server.ts"]
