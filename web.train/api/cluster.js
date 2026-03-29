const cluster = require("cluster");
const os = require("os");

const isPrimary =
  typeof cluster.isPrimary === "boolean" ? cluster.isPrimary : cluster.isMaster;

const getWorkerCount = () => {
  const requested = Number(process.env.CLUSTER_WORKERS);

  if (Number.isInteger(requested) && requested > 0) {
    return requested;
  }

  if (typeof os.availableParallelism === "function") {
    return os.availableParallelism();
  }

  return Math.max(os.cpus().length, 1);
};

if (isPrimary) {
  const workerCount = getWorkerCount();

  console.log(
    `[cluster] primary ${process.pid} starting ${workerCount} worker(s)`
  );

  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    console.log(`[cluster] worker ${worker.process.pid} online`);
  });

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `[cluster] worker ${worker.process.pid} exited (code=${code}, signal=${
        signal || "none"
      }). Restarting...`
    );

    cluster.fork();
  });
} else {
  require("./dist/server");
}
