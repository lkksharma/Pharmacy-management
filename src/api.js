// src/api.js
import axios from 'axios';

const baseURL = 'http://localhost:3001/api';

export const api = {
  // Medicine-related endpoints
  getAllMedicines: () => axios.get(`${baseURL}/medicines`),
  getMedicineById: (id) => axios.get(`${baseURL}/medicines/${id}`),
  getExpiredMedicines: () => axios.get(`${baseURL}/medicines/expired`),
  addMedicine: (medicineData) => axios.post(`${baseURL}/medicines`, medicineData),
  checkMedicineAvailability: (medId) => axios.get(`${baseURL}/medicines/${medId}`),
  
  // Employee-related endpoints
  getEmployeeSalary: (empId) => axios.get(`${baseURL}/employee/${empId}/salary`),
  getAllEmployees: () => axios.get(`${baseURL}/employees`),
  
  // Customer-related endpoints
  getAllCustomers: () => axios.get(`${baseURL}/customers`),
  
  // Order-related endpoints
  createOrder: (orderData) => axios.post(`${baseURL}/create-order`, orderData),
  
  // Bill-related endpoints
  getAllBills: () => axios.get(`${baseURL}/bills`),
  getBillDetails: (billNo) => axios.get(`${baseURL}/bills/${billNo}`),
};