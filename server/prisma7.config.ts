/// <reference types="node" />

// external-imports
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// prisma configuration
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
