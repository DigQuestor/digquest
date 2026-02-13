export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const messageBody = error.message.replace(/^\d+:\s*/, "");
  if (!messageBody) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(messageBody);
    if (typeof parsed?.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Ignore JSON parse errors and fall back to message text
  }

  return messageBody || fallbackMessage;
};
