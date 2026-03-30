import os from "os";
import { execFile } from "child_process";

const GPU_QUERY_FIELDS = [
  "name",
  "utilization.gpu",
  "memory.used",
  "memory.total",
  "temperature.gpu",
  "power.draw",
  "power.limit",
];

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const round = (value, decimals = 1) => {
  return Number(Number(value || 0).toFixed(decimals));
};

const readCpuSnapshot = () => {
  return os.cpus().reduce(
    (total, cpu) => {
      total.idle += cpu.times.idle;
      total.total += Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      return total;
    },
    { idle: 0, total: 0 }
  );
};

const readCpuUsage = async () => {
  const start = readCpuSnapshot();

  await delay(250);

  const end = readCpuSnapshot();
  const idle = end.idle - start.idle;
  const total = end.total - start.total;

  if (!total) return 0;

  return round(((total - idle) / total) * 100);
};

const readMemoryUsage = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    totalBytes: total,
    usedBytes: used,
    freeBytes: free,
    usage: total ? round((used / total) * 100) : 0,
  };
};

const parseGpuValue = (value) => {
  if (!value || value === "[Not Supported]") return null;

  const next = Number(value);

  return Number.isFinite(next) ? next : null;
};

const readGpuUsage = () =>
  new Promise((resolve) => {
    execFile(
      "nvidia-smi",
      [
        `--query-gpu=${GPU_QUERY_FIELDS.join(",")}`,
        "--format=csv,noheader,nounits",
      ],
      (error, stdout) => {
        if (error) {
          resolve({
            available: false,
          });
          return;
        }

        const gpus = stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [
              name,
              usage,
              memoryUsed,
              memoryTotal,
              temperature,
              powerDraw,
              powerLimit,
            ] = line.split(",").map((item) => item.trim());

            const totalMemory = parseGpuValue(memoryTotal);
            const usedMemory = parseGpuValue(memoryUsed);

            return {
              name,
              usage: parseGpuValue(usage),
              memoryUsedMiB: usedMemory,
              memoryTotalMiB: totalMemory,
              memoryUsage:
                totalMemory && usedMemory
                  ? round((usedMemory / totalMemory) * 100)
                  : null,
              temperatureC: parseGpuValue(temperature),
              powerDrawW: parseGpuValue(powerDraw),
              powerLimitW: parseGpuValue(powerLimit),
            };
          });

        if (!gpus.length) {
          resolve({
            available: false,
          });
          return;
        }

        resolve({
          available: true,
          count: gpus.length,
          primary: gpus[0],
          gpus,
        });
      }
    );
  });

export const readSystemMetrics = async () => {
  const [cpuUsage, gpu] = await Promise.all([readCpuUsage(), readGpuUsage()]);
  const memory = readMemoryUsage();

  return {
    capturedAt: new Date(),
    cpu: {
      usage: cpuUsage,
      cores: os.cpus().length,
      loadAverage: os.loadavg().map((value) => round(value, 2)),
    },
    memory,
    gpu,
  };
};
