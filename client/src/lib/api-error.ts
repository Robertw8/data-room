import axios from "axios";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;

  const message = (error.response?.data as { message?: unknown } | undefined)
    ?.message;

  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) return message.join(" ");

  return fallback;
};

export default getApiErrorMessage;
