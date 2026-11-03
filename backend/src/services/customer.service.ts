import { customerRepository } from "../repositories/customer.repository";

export const customerService = {
  create: (data: any) => customerRepository.create(data),

  async list(search: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      customerRepository.findAll(search, skip, limit),
      customerRepository.count(search)
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async get(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    }
    return customer;
  },

  async update(id: string, data: any) {
    await this.get(id);
    return customerRepository.update(id, data);
  },

  async remove(id: string) {
    await this.get(id);
    return customerRepository.softDelete(id);
  }
};
