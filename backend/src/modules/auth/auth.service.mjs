import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.mjs';
import { authRepository } from './auth.repository.mjs';
import { UnauthorizedError } from '../../shared/errors/unauthorized-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

export const authService = {
  async login({ username, password }) {
    const staff = await authRepository.findByUsername(username);
    if (!staff) {
      throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    if (!staff.isActive) {
      throw new UnauthorizedError('Account is disabled. Please contact administrator.', 'ACCOUNT_DISABLED');
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    const payload = {
      id: staff.id,
      username: staff.username,
      role: staff.role
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });

    return {
      token,
      staff: {
        id: staff.id,
        username: staff.username,
        role: staff.role
      }
    };
  },

  async createStaff({ username, password, role }) {
    const existing = await authRepository.findByUsername(username);
    if (existing) {
      throw new ConflictError(`Staff with username '${username}' already exists`, 'USERNAME_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return authRepository.createStaff({
      username,
      passwordHash,
      role
    });
  },

  async getStaffById(id) {
    const staff = await authRepository.findById(id);
    if (!staff) {
      throw new NotFoundError('Staff member not found', 'STAFF_NOT_FOUND');
    }
    return staff;
  },

  async listStaff() {
    return authRepository.listAllStaff();
  },

  async updateStaff(id, { role, isActive }) {
    const staff = await authRepository.findById(id);
    if (!staff) {
      throw new NotFoundError('Staff member not found', 'STAFF_NOT_FOUND');
    }
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    return authRepository.updateStaff(id, updateData);
  },

  async resetPassword(id, newPassword) {
    const staff = await authRepository.findById(id);
    if (!staff) {
      throw new NotFoundError('Staff member not found', 'STAFF_NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    return authRepository.resetPassword(id, passwordHash);
  },

  async toggleStaffStatus(id, isActive) {
    const staff = await authRepository.findById(id);
    if (!staff) {
      throw new NotFoundError('Staff member not found', 'STAFF_NOT_FOUND');
    }
    return authRepository.updateStaffStatus(id, isActive);
  }
};
