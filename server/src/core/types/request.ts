// external-imports
import { type z } from 'zod';

// type for a request that has been validated
export type Validated<T extends z.ZodObject> = {
  validated: z.infer<T>;
};
