import { reportsRepository } from './reports.repository.mjs';

export const reportsService = {
  async getSalesSummary(params) {
    return reportsRepository.getSalesSummary(params);
  },

  async getTopItems(params) {
    return reportsRepository.getTopItems(params);
  },

  async getZonePerformance(params) {
    return reportsRepository.getZonePerformance(params);
  },

  async getStaffPerformance(params) {
    return reportsRepository.getStaffPerformance(params);
  },

  async getPaymentMethodsBreakdown(params) {
    return reportsRepository.getPaymentMethodsBreakdown(params);
  }
};
