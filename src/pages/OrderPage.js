import React, { useState, useEffect } from 'react';
import { api } from '../api';

function OrderPage() {
  const [customer, setCustomer] = useState({
    Name: '',
    Gender: 'Male',
    Age: '',
    Address: '',
    Phone: ''
  });
  
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState({
    Med_ID: '',
    Quantity: 1
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch available medicines
    const fetchMedicines = async () => {
      try {
        const response = await api.getAllMedicines();
        setMedicines(response.data);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setMessage({ 
          text: 'Failed to load medicines. Please try again later.',
          type: 'danger'
        });
      }
    };
    
    fetchMedicines();
  }, []);
  
  const handleCustomerChange = (e) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    });
  };
  
  const handleMedicineChange = (e) => {
    setSelectedMedicine({
      ...selectedMedicine,
      [e.target.name]: e.target.value
    });
  };
  
  const addMedicineToOrder = async () => {
    try {
      if (!selectedMedicine.Med_ID) {
        setMessage({ text: 'Please select a medicine', type: 'danger' });
        return;
      }
      
      // Check if medicine is already in the order
      if (selectedMedicines.some(med => med.Med_ID === selectedMedicine.Med_ID)) {
        setMessage({ text: 'This medicine is already in your order', type: 'warning' });
        return;
      }
      
      // Check availability
      const response = await api.checkMedicineAvailability(selectedMedicine.Med_ID);
      const medicineData = response.data;
      
      if (medicineData.Quantity < selectedMedicine.Quantity) {
        setMessage({ 
          text: `Only ${medicineData.Quantity} units available for ${medicineData.Med_Name}`, 
          type: 'warning' 
        });
        return;
      }
      
      // Add medicine details to order
      const selectedMed = medicines.find(med => med.Med_ID === parseInt(selectedMedicine.Med_ID));
      setSelectedMedicines([
        ...selectedMedicines, 
        {
          ...selectedMed,
          Quantity: parseInt(selectedMedicine.Quantity)
        }
      ]);
      
      // Reset selection
      setSelectedMedicine({ Med_ID: '', Quantity: 1 });
      setMessage({ text: 'Medicine added to order', type: 'success' });
    } catch (error) {
      console.error('Error checking medicine availability:', error);
      setMessage({ 
        text: 'Error adding medicine to order', 
        type: 'danger' 
      });
    }
  };
  
  const removeMedicineFromOrder = (medId) => {
    setSelectedMedicines(selectedMedicines.filter(med => med.Med_ID !== medId));
    setMessage({ text: 'Medicine removed from order', type: 'success' });
  };
  
  const calculateTotal = () => {
    return selectedMedicines.reduce((total, med) => {
      return total + (med.cost_price * med.Quantity);
    }, 0).toFixed(2);
  };
  
  const submitOrder = async () => {
    // Basic validation
    if (!customer.Name || !customer.Phone) {
      setMessage({ text: 'Customer name and phone are required', type: 'danger' });
      return;
    }
    
    if (selectedMedicines.length === 0) {
      setMessage({ text: 'Please add at least one medicine to the order', type: 'danger' });
      return;
    }
    
    try {
      setLoading(true);
      
      const orderData = {
        customerDetails: customer,
        orderItems: selectedMedicines.map(med => ({
          Med_ID: med.Med_ID,
          Quantity: med.Quantity
        })),
        employeeId: 1 // Default employee ID
      };
      
      const response = await api.createOrder(orderData);
      
      setMessage({ 
        text: `Order successfully created! Bill #${response.data.billNo}`,
        type: 'success'
      });
      
      // Reset form
      setCustomer({
        Name: '',
        Gender: 'Male',
        Age: '',
        Address: '',
        Phone: ''
      });
      setSelectedMedicines([]);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      setMessage({ 
        text: error.response?.data?.error || 'Failed to create order',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Place New Order</h2>
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="card">
        <h3>Customer Information</h3>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="Name"
            className="form-control"
            value={customer.Name}
            onChange={handleCustomerChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Gender</label>
          <select
            name="Gender"
            className="form-control"
            value={customer.Gender}
            onChange={handleCustomerChange}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            name="Age"
            className="form-control"
            value={customer.Age}
            onChange={handleCustomerChange}
          />
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <textarea
            name="Address"
            className="form-control"
            value={customer.Address}
            onChange={handleCustomerChange}
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            name="Phone"
            className="form-control"
            value={customer.Phone}
            onChange={handleCustomerChange}
            required
          />
        </div>
      </div>
      
      <div className="card mt-4">
        <h3>Add Medicines</h3>
        
        <div className="form-group">
          <label>Select Medicine</label>
          <select
            name="Med_ID"
            className="form-control"
            value={selectedMedicine.Med_ID}
            onChange={handleMedicineChange}
          >
            <option value="">-- Select Medicine --</option>
            {medicines.map(med => (
              <option key={med.Med_ID} value={med.Med_ID}>
                {med.Med_Name} - ${med.cost_price} (Stock: {med.Quantity})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            name="Quantity"
            className="form-control"
            value={selectedMedicine.Quantity}
            onChange={handleMedicineChange}
            min="1"
          />
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={addMedicineToOrder}
        >
          Add to Order
        </button>
      </div>
      
      {selectedMedicines.length > 0 && (
        <div className="card mt-4">
          <h3>Order Summary</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedMedicines.map(med => (
                <tr key={med.Med_ID}>
                  <td>{med.Med_Name}</td>
                  <td>${med.cost_price}</td>
                  <td>{med.Quantity}</td>
                  <td>${(med.cost_price * med.Quantity).toFixed(2)}</td>
                  <td>
                    <button 
                      onClick={() => removeMedicineFromOrder(med.Med_ID)}
                      style={{ 
                        background: '#dc3545', 
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan="3" style={{ textAlign: 'right' }}>Total:</td>
                <td>${calculateTotal()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <button 
            className="btn btn-primary" 
            onClick={submitOrder}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderPage;
