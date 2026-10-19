#!/usr/bin/env node
/**
 * scripts/dev.js — Unified local development launcher for Customer Lens.
 * 
 * Starts both the FastAPI backend and React Vite frontend with:
 * - Pre-flight dependency & Python environment validation
 * - Port collision detection
 * - Clean, colorized logs with [backend] and [frontend] prefixes
 * - Automatic process-tree termination on Ctrl+C (no orphaned servers)
 */

const { spawn, execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// Terminal color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logInfo(msg) {
  console.log(`${c.bold}${c.blue}[CustomerLens]${c.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${c.bold}${c.green}[CustomerLens]${c.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`${c.bold}${c.yellow}[CustomerLens:WARN]${c.reset} ${msg}`);
}

function logError(msg) {
  console.error(`${c.bold}${c.red}[CustomerLens:ERROR]${c.reset} ${msg}`);
}

/**
 * Check if a TCP port is currently in use.
 */
function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      resolve(err.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, host);
  });
}

/**
 * Locate a working Python interpreter.
 */
function findPythonInterpreter() {
  const isWin = process.platform === 'win32';
  const candidates = [];

  // Check active virtual environment
  if (process.env.VIRTUAL_ENV) {
    const venvBin = isWin
      ? path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe')
      : path.join(process.env.VIRTUAL_ENV, 'bin', 'python');
    candidates.push(venvBin);
  }

  // Check standard local virtualenv directories
  const localDirs = ['.venv', 'venv', 'env'];
  for (const d of localDirs) {
    const p = isWin
      ? path.join(ROOT_DIR, d, 'Scripts', 'python.exe')
      : path.join(ROOT_DIR, d, 'bin', 'python');
    if (fs.existsSync(p)) {
      candidates.push(p);
    }
  }

  // System interpreters
  candidates.push(isWin ? 'python' : 'python3');
  candidates.push('py');

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" --version`, { stdio: 'ignore' });
      return candidate;
    } catch (e) {
      // Continue checking next candidate
    }
  }

  return null;
}

/**
 * Validate that required Python packages are installed.
 */
function validatePythonPackages(pythonCmd) {
  try {
    const out = execFileSync(
      pythonCmd,
      ['-c', 'import fastapi, uvicorn, sklearn, pandas, numpy, joblib; print("OK")'],
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return out.includes('OK');
  } catch (e) {
    return false;
  }
}

/**
 * Attempt to cleanly free a local port on Windows if an orphaned process is listening.
 */
function freePortIfOccupied(port) {
  if (process.platform !== 'win32') return;
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const lines = stdout.split(/\r?\n/).filter((l) => l.includes('LISTENING'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        logWarn(`Found existing process (PID ${pid}) on port ${port}. Terminating orphaned process...`);
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      }
    }
  } catch (e) {
    // Port is not occupied
  }
}

/**
 * Kill a process and its child tree reliably on Windows and Unix.
 */
function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGTERM');
    }
  } catch (e) {
    // Process already exited
  }
}

async function main() {
  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   Customer Lens: Local Development Server Launcher   ${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}\n`);

  // 1. Verify frontend dependencies
  const frontendModules = path.join(FRONTEND_DIR, 'node_modules');
  if (!fs.existsSync(frontendModules)) {
    logError('Frontend node_modules not found!');
    console.log(`\n  Please install frontend dependencies first:\n`);
    console.log(`  ${c.bold}cd frontend && npm install${c.reset}\n`);
    process.exit(1);
  }

  // 2. Verify Python interpreter and packages
  logInfo('Checking Python environment...');
  const pythonCmd = findPythonInterpreter();
  if (!pythonCmd) {
    logError('Python interpreter not found on PATH or in a local virtual environment.');
    console.log('\n  Please ensure Python 3.10+ is installed and accessible.\n');
    process.exit(1);
  }

  const packagesOk = validatePythonPackages(pythonCmd);
  if (!packagesOk) {
    logError('Required Python packages are missing.');
    console.log(`\n  Using Python: ${c.bold}${pythonCmd}${c.reset}`);
    console.log(`  Please install backend dependencies by running:\n`);
    console.log(`  ${c.bold}pip install -r requirements.txt${c.reset}\n`);
    console.log(`  (If using a virtualenv, activate it first: .\\venv\\Scripts\\Activate.ps1)\n`);
    process.exit(1);
  }
  logSuccess(`Python environment verified: ${pythonCmd}`);

  // 3. Port collision checks and cleanup
  const port8000InUse = await isPortInUse(8000);
  if (port8000InUse) {
    freePortIfOccupied(8000);
  }

  const port5173InUse = await isPortInUse(5173);
  if (port5173InUse) {
    freePortIfOccupied(5173);
  }

  // 4. Spawn backend process
  logInfo('Starting FastAPI backend on http://127.0.0.1:8000 ...');
  const backendEnv = {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONPATH: `${BACKEND_DIR}${path.delimiter}${ROOT_DIR}`,
  };

  const backendProc = spawn(
    pythonCmd,
    ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'],
    {
      cwd: BACKEND_DIR,
      env: backendEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  // 5. Spawn frontend process (run Vite directly via node runtime)
  logInfo('Starting Vite frontend on http://localhost:5173 ...');
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const frontendProc = spawn(
    process.execPath,
    [viteBin],
    {
      cwd: FRONTEND_DIR,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  // Prefix logging
  function pipeOutput(stream, prefix, color) {
    stream.on('data', (chunk) => {
      const lines = chunk.toString().split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().length > 0) {
          console.log(`${color}${prefix}${c.reset} ${line}`);
        }
      }
    });
  }

  pipeOutput(backendProc.stdout, '[backend] ', c.cyan);
  pipeOutput(backendProc.stderr, '[backend] ', c.yellow);
  pipeOutput(frontendProc.stdout, '[frontend]', c.green);
  pipeOutput(frontendProc.stderr, '[frontend]', c.yellow);

  console.log(`\n${c.bold}${c.green}✔ Application services launching...${c.reset}`);
  console.log(`  • Frontend: ${c.bold}http://localhost:5173${c.reset}`);
  console.log(`  • Backend:  ${c.bold}http://127.0.0.1:8000${c.reset}`);
  console.log(`  • API Docs: ${c.bold}http://127.0.0.1:8000/api/docs${c.reset}\n`);
  console.log(`${c.dim}Press Ctrl+C to terminate both servers.${c.reset}\n`);

  // Process termination handling
  let isShuttingDown = false;
  function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n${c.bold}${c.yellow}[CustomerLens] Stopping all services...${c.reset}`);

    if (backendProc && backendProc.pid) {
      killTree(backendProc.pid);
    }
    if (frontendProc && frontendProc.pid) {
      killTree(frontendProc.pid);
    }

    console.log(`${c.bold}${c.green}[CustomerLens] All services stopped cleanly.${c.reset}`);
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  backendProc.on('exit', (code) => {
    if (!isShuttingDown) {
      logError(`Backend process exited with code ${code}`);
      cleanup();
    }
  });

  frontendProc.on('exit', (code) => {
    if (!isShuttingDown) {
      logError(`Frontend process exited with code ${code}`);
      cleanup();
    }
  });
}

main().catch((err) => {
  logError(`Startup failed: ${err.message}`);
  process.exit(1);
});
