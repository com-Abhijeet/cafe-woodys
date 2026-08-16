import { customerRepository } from './customer.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

function formatCustomerProfile(customer) {
  if (!customer) return null;

  const paidBills = (customer.bills || []).filter((b) => b.paymentStatus === 'PAID');
  const totalSpendPaise = paidBills.reduce((sum, b) => sum + b.grandTotal, 0);
  const visitCount = customer.bills ? customer.bills.length : (customer._count?.bills || 0);

  return {
    ...customer,
    totalSpendPaise,
    visitCount
  };
}

export const customerService = {
  async searchCustomers(query) {
    const customers = await customerRepository.search(query);
    return customers.map(formatCustomerProfile);
  },

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    return formatCustomerProfile(customer);
  },

  async createCustomer(data) {
    const created = await customerRepository.create(data);
    return formatCustomerProfile(created);
  },

  async updateCustomer(id, data) {
    const existing = await customerRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }
    const updated = await customerRepository.update(id, data);
    return formatCustomerProfile(updated);
  }
};
