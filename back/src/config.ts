import 'dotenv/config';

type LoggingConfig = {
  formatPreset: string;
};

type DatabaseConfig = {
  url: string;
};

type ServerConfig = {
  port: number;
};

type AppConfig = {
  database: DatabaseConfig;
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
  },
  database: {
    url: 'postgres://vlan:vlanpass@localhost:5432/vlan_app'
  }
};

export const config: AppConfig = {
  server: {
    port: parseNumber(process.env.PORT, defaultConfig.server.port)
  },
  logging: {
    formatPreset: process.env.LOG_FORMAT_PRESET ?? defaultConfig.logging.formatPreset
  },
  database: {
    url: process.env.DATABASE_URL ?? defaultConfig.database.url
  }
};
