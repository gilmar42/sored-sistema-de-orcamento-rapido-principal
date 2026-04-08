const { spawn } = require('child_process');

const [,, envValue, command, ...args] = process.argv;

if (!envValue || !command) {
  console.error('Usage: node scripts/run-with-node-env.cjs <NODE_ENV> <command> [...args]');
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: envValue,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
