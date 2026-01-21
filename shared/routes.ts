import { z } from 'zod';
import { insertUserSchema, insertTransactionSchema, insertLoanSchema, users, transactions, loans } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  paymentRequired: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    transfer: {
      method: 'POST' as const,
      path: '/api/transactions/transfer',
      input: z.object({
        toUserId: z.number(),
        amount: z.number().positive(),
        description: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        402: errorSchemas.paymentRequired,
      },
    },
    fine: {
      method: 'POST' as const,
      path: '/api/transactions/fine',
      input: z.object({
        userId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    }
  },
  loans: {
    list: {
      method: 'GET' as const,
      path: '/api/loans',
      responses: {
        200: z.array(z.custom<typeof loans.$inferSelect>()),
      },
    },
    apply: {
      method: 'POST' as const,
      path: '/api/loans',
      input: z.object({
        amount: z.number().positive(),
      }),
      responses: {
        201: z.custom<typeof loans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    repay: {
      method: 'POST' as const,
      path: '/api/loans/:id/repay',
      input: z.object({
        amount: z.number().positive(),
      }),
      responses: {
        200: z.custom<typeof loans.$inferSelect>(),
        400: errorSchemas.validation,
        402: errorSchemas.paymentRequired,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
