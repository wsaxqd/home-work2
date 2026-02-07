import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId?: string | number;
        id?: string | number;
        email?: string;
        role?: string;
      };
      userId?: string | number;
    }
  }
}

export {};
