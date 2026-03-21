import { ZodError } from 'zod';

export function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => e.message).join(', ');
        return next({ name: 'ValidationError', message, statusCode: 400 });
      }
      next(err);
    }
  };
}
