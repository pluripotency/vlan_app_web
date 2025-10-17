import 'dotenv/config';

type LoggingConfig = {
  formatPreset: string;
};

type ServerConfig = {
  port: number;
};

type AppConfig = {
  server: ServerConfig;
  logging: LoggingConfig;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const defaultConfig: AppConfig = {
  server: {
    port: 3000
  },
  logging: {
    formatPreset: 'dev'
  }
};

export const config: AppConfig = {
  server: {
    port: parseNumber(process.env.PORT, defaultConfig.server.port)
  },
  logging: {
    formatPreset: process.env.LOG_FORMAT_PRESET ?? defaultConfig.logging.formatPreset
  }
};
