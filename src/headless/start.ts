import axios from "axios";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

interface Config {
  username: string;
  password: string;
  apiBase: string;
  wsEndpoint: string;
  outputDir: string;
}

interface IAuth {
  token: string;
  exp: number;
  iat: number;
  sub: string;
  claim: any;
  sessionId: string;
}

interface IReport {
  createdAt: number;
  url: string;
  prompts: string;
  negatives: string;
  loras: string;
  checkpoint: string;
}

async function login(config: Config): Promise<IAuth> {
  const { username, password, apiBase } = config;
  const res = await axios.post<IAuth>(`${apiBase}/users/login`, {
    username,
    password,
  });
  return res.data;
}

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

function todayDir(baseDir: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dir = path.join(baseDir, today);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function start(configPath: string) {
  const config: Config = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf-8"));
  const auth = await login(config);
  console.log(`Logged in as ${auth.sub}`);

  const ws = new WebSocket(`${config.wsEndpoint}/?auth=${auth.token}`);

  ws.addEventListener("open", () => {
    console.log("WebSocket connected");
  });

  ws.addEventListener("message", async (event: MessageEvent) => {
    const data = JSON.parse(event.data as string);
    if (data.type !== "NewImage") return;

    const report: IReport = data.data;
    const imageUrl = report.url;
    const filename = path.basename(new URL(imageUrl).pathname);
    const dest = path.join(todayDir(config.outputDir), filename);

    console.log(`Downloading: ${imageUrl}`);
    try {
      await downloadImage(imageUrl, dest);
      console.log(`Saved: ${dest}`);
    } catch (err) {
      console.error(`Failed to download ${imageUrl}:`, err);
    }
  });

  ws.addEventListener("error", (event: Event) => {
    console.error("WebSocket error:", event);
  });

  ws.addEventListener("close", (event: CloseEvent) => {
    console.log(`WebSocket closed (${event.code}): ${event.reason}`);
  });
}

if (require.main === module) {
  const configArg = process.argv[2];
  if (!configArg) {
    console.error("Usage: npx tsx start.ts path/to/config.json");
    process.exit(1);
  }
  start(configArg).catch(console.error);
}
