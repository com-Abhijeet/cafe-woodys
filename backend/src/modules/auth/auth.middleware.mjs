import jwt from 'jsonwebtoken';
import { config } from '../../config/env.mjs';
import prisma from '../../shared/db/client.mjs';
import { UnauthorizedError } from '../../shared/errors/unauthorized-error.mjs';
import { ForbiddenError } from '../../shared/errors/forbidden-error.mjs';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required', 'TOKEN_MISSING'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, isActive: true }
    });

    if (!staff || !staff.isActive) {
      return next(new UnauthorizedError('Session invalid or account no longer exists. Please sign in again.', 'SESSION_INVALID'));
    }

    req.user = staff;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Session expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Invalid authorization token', 'TOKEN_INVALID'));
  }
}

export const authenticateToken = requireAuth;

export function requireRole(allowedRoles = []) {
  const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'UNAUTHORIZED'));
    }

    if (!rolesList.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
}
