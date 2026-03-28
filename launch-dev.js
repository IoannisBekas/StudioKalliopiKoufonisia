const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const isPortOpen = (targetPort, targetHost) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port: targetPort, host: targetHost });

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.once("error", () => {
      resolve(false);
    });
  });

const start = async () => {
  const alreadyRunning = await isPortOpen(port, host);

  if (alreadyRunning) {
    console.log(`Server already running at http://${host}:${port}`);
    return;
  }

  const child = spawn(process.execPath, [path.join(__dirname, "dev-server.js")], {
    cwd: __dirname,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
  });

  child.unref();
  console.log(`Started dev server at http://${host}:${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
