const COLORS = {
  info: '\u001b[36m',
  warn: '\u001b[33m',
  error: '\u001b[31m',
  reset: '\u001b[0m',
};

function log(level, message, metadata = '') {
  const timestamp = new Intl.DateTimeFormat('en-GB', {
    timeZone: process.env.LOG_TIME_ZONE || 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
  const color = process.stdout.isTTY ? COLORS[level] : '';
  const reset = process.stdout.isTTY ? COLORS.reset : '';
  const suffix = metadata ? ` ${metadata}` : '';
  const output = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${suffix}`;
  (level === 'error' ? console.error : console.log)(`${color}${output}${reset}`);
}

module.exports = {
  info: (message, metadata) => log('info', message, metadata),
  warn: (message, metadata) => log('warn', message, metadata),
  error: (message, metadata) => log('error', message, metadata),
};
