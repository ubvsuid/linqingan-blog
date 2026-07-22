import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = process.env.SMOKE_PORT || "3210";
const baseUrl = `http://${host}:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const server = spawn(
  npmCommand,
  ["run", "start", "--", "--hostname", host, "--port", port],
  {
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

server.stdout.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

function stopServer() {
  if (server.killed) return;

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    killer.unref();
  } else {
    server.kill("SIGTERM");
  }
}

const smoke = spawn(process.execPath, ["scripts/smoke-test.mjs"], {
  env: { ...process.env, BASE_URL: baseUrl },
  stdio: "inherit",
});

const timeout = setTimeout(() => {
  console.error("冒烟测试超时，终止本地生产服务器。");
  smoke.kill("SIGTERM");
  stopServer();
  process.exit(1);
}, 120_000);

smoke.on("exit", (code) => {
  clearTimeout(timeout);
  stopServer();
  process.exit(code ?? 1);
});

server.on("exit", (code) => {
  if (code && smoke.exitCode === null) {
    console.error(`本地生产服务器提前退出，状态码 ${code}。`);
    smoke.kill("SIGTERM");
  }
});

process.on("SIGINT", () => {
  stopServer();
  process.exit(130);
});
process.on("SIGTERM", () => {
  stopServer();
  process.exit(143);
});