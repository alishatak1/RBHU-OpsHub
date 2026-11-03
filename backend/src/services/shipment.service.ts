import { shipmentRepository } from "../repositories/shipment.repository";

export const shipmentService = {
  create: (data: any) => shipmentRepository.create(data),
  list: () => shipmentRepository.findAll(),

  async get(id: string) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw Object.assign(new Error("Shipment not found"), { statusCode: 404 });
    return shipment;
  },

  async updateStatus(id: string, status: any) {
    await this.get(id);
    return shipmentRepository.updateStatus(id, status);
  }
};
