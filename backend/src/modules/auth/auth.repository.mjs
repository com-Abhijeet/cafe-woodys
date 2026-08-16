import prisma from '../../shared/db/client.mjs';

export const authRepository = {
  async findByUsername(username) {
    return prisma.staff.findUnique({
      where: { username }
    });
  },

  async findById(id) {
    return prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  async createStaff({ username, passwordHash, role }) {
    return prisma.staff.create({
      data: {
        username,
        passwordHash,
        role
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  },

  async listAllStaff() {
    return prisma.staff.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async updateStaffStatus(id, isActive) {
    return prisma.staff.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });
  },

  async updateStaff(id, data) {
    return prisma.staff.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
  },

  async resetPassword(id, passwordHash) {
    return prisma.staff.update({
      where: { id },
      data: { passwordHash },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    });
  }
};
