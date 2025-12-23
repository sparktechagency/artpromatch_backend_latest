const getTimestamp = () => {
  return new Date().toLocaleString(); // e.g. "4/18/2025, 2:35:10 PM"
};

// Log success message to success.txt
const logSuccess = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`[SUCCESS] ${getTimestamp()} - ${message}`);
};

// ❌ Log error message to error.txt (with optional stack)
const logError = (message: string, error?: unknown) => {
  let details = '';

  if (error instanceof Error) {
    details = `\nMessage: ${error.message}\nStack: ${error.stack}`;
  } else if (typeof error === 'string') {
    details = `\n${error}`;
  } else if (typeof error === 'object' && error !== null) {
    details = `\n${JSON.stringify(error, null, 2)}`;
  }

  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${getTimestamp()} - ${message}${details}`);
};

// ℹ️ Optional info log to success.txt
const logInfo = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`[INFO] ${getTimestamp()} - ${message}`);
};

export const Logger = {
  success: logSuccess,
  error: logError,
  info: logInfo,
};
