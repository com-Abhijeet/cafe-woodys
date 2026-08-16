import jwt from 'jsonwebtoken';
import { config } from '../../config/env.mjs';
import { UnauthorizedError } from '../../shared/errors/unauthorized-error.mjs';
import { ForbiddenError } from '../../shared/errors/forbidden-error.mjs';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required', 'TOKEN_MISSING'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Session expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Invalid authorization token', 'TOKEN_INVALID'));
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
}
