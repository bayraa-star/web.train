import { captureMonitorSnapshot } from "../utils/terminalSnapshot";
import { readSystemMetrics } from "../utils/systemMetrics";

export const readMonitor = async (request, response) => {
  const snapshot = await captureMonitorSnapshot(request.params.name);

  return response.json(snapshot);
};

export const readMetrics = async (request, response) => {
  return response.json(await readSystemMetrics());
};
