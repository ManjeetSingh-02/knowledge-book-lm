// internal-imports
import { auth, corsConfig, errorHandler, inngest, loadModules } from '@/core/index.js';

// external-imports
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import { serve } from 'inngest/express';

// function to create application
export default async function createApp() {
  // create express application
  const application = express();

  // attach middlewares
  application
    .use(cors(corsConfig))
    .all('/api/v1/auth/{*any}', toNodeHandler(auth))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use('/api/inngest', serve({ client: inngest, functions: [] }));

  // load all modules
  await loadModules(application);

  // attach error handler
  application.use(errorHandler);

  // return the application
  return application;
}
