import { z } from 'zod';

/**
 * Creates a middleware that validates request data against a Zod schema
 * @param {Object} schema - Zod schema for validation
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const formattedErrors = result.error.format();
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Replace request data with validated data
      req[source] = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Validation processing error'
      });
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const idSchema = z.object({
  id: z.string().uuid()
});

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  ...paginationSchema.shape
}); 