// File: src/pages/InventoryPage.js (continued)
import React, { useState, useEffect } from 'react';
import { api } from '../api';

function InventoryPage() {
  const [medicines, setMedicines] = useState([]);
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    // Fetch both available and expired medicines
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const [medicinesResponse, expiredResponse] = await Promise.all([
          api.getAllMedicines(),
          api.getExpiredMedicines()
        ]);
        
        // Filter out expired medicines from available medicines
        const today = new Date();
        const available = medicinesResponse.data.filter(med => {
          const expDate = new Date(med.Exp_date);
          return expDate > today;
        });
        
        setMedicines(available);
        setExpiredMedicines(expiredResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Failed to load inventory data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate if stock is low (less than 10 units)
  const getStockStatus = (quantity) => {
    if (quantity <= 10) {
      return <span style={{ color: 'red', fontWeight: 'bold' }}>Low Stock!</span>;
    }
    return <span style={{ color: 'green' }}>In Stock</span>;
  };

  return (
    <div>
      <h2>Inventory Management</h2>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('available')}
        >
          Available Medicines
        </button>
        <button 
          className={`btn ${activeTab === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('expired')}
        >
          Expired Medicines
        </button>
      </div>
      
      {loading ? (
        <div className="text-center">
          <p>Loading inventory data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'available' && (
            <div className="card">
              <h3>Available Medicines</h3>
              {medicines.length === 0 ? (
                <p>No available medicines found.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Expiry Date</th>
                      <th>Cost Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map(med => (
                      <tr key={med.Med_ID}>
                        <td>{med.Med_ID}</td>
                        <td>{med.Med_Name}</td>
                        <td>{med.Manufacturer}</td>
                        <td>{med.Category}</td>
                        <td>{med.Quantity}</td>
                        <td>{getStockStatus(med.Quantity)}</td>
                        <td>{formatDate(med.Exp_date)}</td>
                        <td>${med.cost_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          {activeTab === 'expired' && (
            <div className="card">
              <h3>Expired Medicines</h3>
              {expiredMedicines.length === 0 ? (
                <p>No expired medicines found.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Expiry Date</th>
                      <th>Cost Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredMedicines.map(med => (
                      <tr key={med.Med_ID} style={{ backgroundColor: '#fff3cd' }}>
                        <td>{med.Med_ID}</td>
                        <td>{med.Med_Name}</td>
                        <td>{med.Manufacturer}</td>
                        <td>{med.Category}</td>
                        <td>{med.Quantity}</td>
                        <td>{formatDate(med.Exp_date)}</td>
                        <td>${med.cost_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              <div className="alert alert-warning mt-4">
                <h4>Note:</h4>
                <p>Expired medicines should be properly disposed of according to pharmacy regulations.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InventoryPage;