import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = {
  getAllMedicines: () => axios.get(`${API_URL}/medicines`),
  getExpiredMedicines: () => axios.get(`${API_URL}/medicines/expired`),
  checkMedicineAvailability: (medId) => axios.get(`${API_URL}/medicines/${medId}`),
  createOrder: (orderData) => axios.post(`${API_URL}/orders`, orderData)
};
