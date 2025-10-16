declare module 'pg' {
  import type { EventEmitter } from 'node:events';

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
    rows: T[];
    rowCount: number;
  }

  export class Pool extends EventEmitter {
    constructor(config?: string | PoolConfig);
    connect(): Promise<unknown>;
    end(): Promise<void>;
    query<T extends QueryResultRow = QueryResultRow>(queryText: string, values?: unknown[]): Promise<QueryResult<T>>;
  }
}
