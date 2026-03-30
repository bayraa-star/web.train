import { spawn } from "child_process";

const ESC = "\u001b";
const CSI = `${ESC}[`;
const OSC = `${ESC}]`;

const DEFAULT_COLUMNS = 120;
const DEFAULT_ROWS = 36;
const ALT_CHARSET_MAP = {
  j: "+",
  k: "+",
  l: "+",
  m: "+",
  n: "+",
  q: "-",
  t: "+",
  u: "+",
  v: "+",
  w: "+",
  x: "|",
};

const createBuffer = (rows, columns) => {
  return Array.from({ length: rows }, () => Array(columns).fill(" "));
};

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const clearLine = (buffer, row, startColumn = 0, endColumn = buffer[row].length) => {
  if (!buffer[row]) return;

  for (let index = startColumn; index < endColumn; index += 1) {
    buffer[row][index] = " ";
  }
};

const clearScreen = (buffer, startRow = 0, startColumn = 0) => {
  for (let row = startRow; row < buffer.length; row += 1) {
    clearLine(buffer, row, row === startRow ? startColumn : 0);
  }
};

const applyCsi = (sequence, state) => {
  const final = sequence.slice(-1);
  const rawParams = sequence.slice(2, -1);
  const params = rawParams.split(";").filter(Boolean).map((value) => Number(value) || 0);
  const first = params[0] || 0;
  const second = params[1] || 0;
  const maxRow = state.buffer.length - 1;
  const maxColumn = state.buffer[0].length - 1;

  switch (final) {
    case "A":
      state.row = clamp(state.row - (first || 1), 0, maxRow);
      break;
    case "B":
      state.row = clamp(state.row + (first || 1), 0, maxRow);
      break;
    case "C":
      state.column = clamp(state.column + (first || 1), 0, maxColumn);
      break;
    case "D":
      state.column = clamp(state.column - (first || 1), 0, maxColumn);
      break;
    case "H":
    case "f":
      state.row = clamp((first || 1) - 1, 0, maxRow);
      state.column = clamp((second || 1) - 1, 0, maxColumn);
      break;
    case "J":
      if (first === 2 || first === 3) {
        clearScreen(state.buffer);
        state.row = 0;
        state.column = 0;
      } else {
        clearScreen(state.buffer, state.row, state.column);
      }
      break;
    case "K":
      if (first === 1) {
        clearLine(state.buffer, state.row, 0, state.column + 1);
      } else if (first === 2) {
        clearLine(state.buffer, state.row);
      } else {
        clearLine(state.buffer, state.row, state.column);
      }
      break;
    case "m":
    case "h":
    case "l":
    case "t":
      break;
    case "s":
      state.savedRow = state.row;
      state.savedColumn = state.column;
      break;
    case "u":
      state.row = state.savedRow;
      state.column = state.savedColumn;
      break;
    default:
      break;
  }
};

const renderTerminalOutput = (output, columns = DEFAULT_COLUMNS, rows = DEFAULT_ROWS) => {
  const state = {
    buffer: createBuffer(rows, columns),
    row: 0,
    column: 0,
    savedRow: 0,
    savedColumn: 0,
    g0Charset: "ascii",
    g1Charset: "ascii",
    activeCharset: "ascii",
  };

  for (let index = 0; index < output.length; index += 1) {
    const char = output[index];

    if (char === ESC) {
      const next = output[index + 1];

      if (next === "[") {
        const match = output.slice(index).match(/^\u001b\[[0-9;?]*[ -/]*[@-~]/);

        if (match) {
          applyCsi(match[0], state);
          index += match[0].length - 1;
          continue;
        }
      }

      if (next === "]") {
        const terminatorIndex = output.indexOf("\u0007", index + 2);

        if (terminatorIndex !== -1) {
          index = terminatorIndex;
          continue;
        }
      }

      if (next === "c") {
        clearScreen(state.buffer);
        state.row = 0;
        state.column = 0;
        index += 1;
        continue;
      }

      if ((next === "(" || next === ")") && output[index + 2]) {
        const charset = output[index + 2] === "0" ? "line" : "ascii";

        if (next === "(") {
          state.g0Charset = charset;
        } else {
          state.g1Charset = charset;
        }

        index += 2;
        continue;
      }

      continue;
    }

    if (char === "\u000e") {
      state.activeCharset = state.g1Charset;
      continue;
    }

    if (char === "\u000f") {
      state.activeCharset = state.g0Charset;
      continue;
    }

    if (char === "\r") {
      state.column = 0;
      continue;
    }

    if (char === "\n") {
      state.row = clamp(state.row + 1, 0, rows - 1);
      continue;
    }

    if (char === "\b") {
      state.column = clamp(state.column - 1, 0, columns - 1);
      continue;
    }

    if (char === "\t") {
      state.column = clamp(state.column + 2, 0, columns - 1);
      continue;
    }

    if (char < " " || state.row >= rows || state.column >= columns) {
      continue;
    }

    const value =
      state.activeCharset === "line" ? ALT_CHARSET_MAP[char] || char : char;

    state.buffer[state.row][state.column] = value;
    state.column += 1;

    if (state.column >= columns) {
      state.column = columns - 1;
    }
  }

  return state.buffer
    .map((line) => line.join("").replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}$/g, "\n\n")
    .trimEnd();
};

const runScriptCommand = (command, { columns = DEFAULT_COLUMNS, rows = DEFAULT_ROWS, timeoutMs = 5000 } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn("script", ["-qfc", command, "/dev/null"], {
      env: {
        ...process.env,
        TERM: "xterm",
        COLUMNS: String(columns),
        LINES: String(rows),
      },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };

    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      rejectOnce(new Error("Terminal snapshot timed out"));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", rejectOnce);

    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        rejectOnce(new Error(stderr.trim() || `Command failed with code ${code}`));
        return;
      }

      resolveOnce({
        code,
        stdout,
        stderr,
      });
    });
  });

export const monitorCommands = {
  htop: {
    command:
      "htop --readonly --no-color --no-mouse --no-unicode --delay=20 --max-iterations=1",
    timeoutMs: 5000,
  },
  nvtop: {
    command: "timeout --signal=TERM 0.4s nvtop --no-color --no-plot --delay 20",
    timeoutMs: 5000,
  },
};

export const captureMonitorSnapshot = async (name) => {
  const config = monitorCommands[name];

  if (!config) {
    throw new Error("Unknown monitor");
  }

  const result = await runScriptCommand(config.command, {
    timeoutMs: config.timeoutMs,
  });

  return {
    name,
    output: renderTerminalOutput(result.stdout),
    capturedAt: new Date(),
    exitCode: result.code,
  };
};
