// PostgreSQL uses 'jsonb', SQLite uses 'simple-json'
export const JSON_COLUMN_TYPE: 'jsonb' | 'simple-json' = process.env.DATABASE_URL
  ? 'jsonb'
  : 'simple-json';
