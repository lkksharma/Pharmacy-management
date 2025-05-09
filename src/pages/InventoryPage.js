import React, { useState, useEffect } from 'react';
import { api } from '../api';

function InventoryPage() {
  const [medicines, setMedicines] = useState([]);
  const [expiredMedicines, setExpiredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // New medicine form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    Med_Name: '',
    Manufacturer: '',
    Expiry_date: '',
    cost_price: '',
    Batch_no: '',
    Quantity: '',
    Category: '',
    Batch_price: ''
  });
  
  // Inventory update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [actionType, setActionType] = useState('add'); // 'add' or 'dispose'
  
  // Success/error message state
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch data whenever refreshTrigger changes
  useEffect(() => {
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
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getStockStatus = (quantity) => {
    if (quantity <= 10) {
      return <span style={{ color: 'red', fontWeight: 'bold' }}>Low Stock!</span>;
    }
    return <span style={{ color: 'green' }}>In Stock</span>;
  };
  
  // Handle input changes for new medicine form
  const handleNewMedicineChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine({
      ...newMedicine,
      [name]: value
    });
  };
  
  // Handle submit for new medicine
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      if (!newMedicine.Med_Name || !newMedicine.Manufacturer || 
          !newMedicine.Expiry_date || !newMedicine.cost_price || 
          !newMedicine.Batch_no || !newMedicine.Quantity || 
          !newMedicine.Category || !newMedicine.Batch_price) {
        setMessage({ text: 'All fields are required', type: 'danger' });
        setLoading(false);
        return;
      }
      
      // Send request to add medicine
      await api.addMedicine(newMedicine);
      
      // Show success message
      setMessage({ text: 'Medicine added successfully', type: 'success' });
      
      // Reset form
      setNewMedicine({
        Med_Name: '',
        Manufacturer: '',
        Expiry_date: '',
        cost_price: '',
        Batch_no: '',
        Quantity: '',
        Category: '',
        Batch_price: ''
      });
      
      // Hide form and refresh data
      setShowAddForm(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error adding medicine:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to add medicine', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle select medicine for update
  const handleSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine);
    setUpdateQuantity('');
    setShowUpdateForm(true);
  };
  
  // Handle update stock
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    
    if (!selectedMedicine || !updateQuantity) {
      setMessage({ text: 'Please select a medicine and enter quantity', type: 'danger' });
      return;
    }
    
    const quantity = parseInt(updateQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setMessage({ text: 'Please enter a valid quantity', type: 'danger' });
      return;
    }
    
    try {
      setLoading(true);
      
      if (actionType === 'add') {
        // Update stock API call (would need to be implemented in backend)
        await api.updateMedicineStock(selectedMedicine.Med_ID, {
          Batch_no: selectedMedicine.Batch_no,
          Quantity: quantity,
          action: 'add'
        });
        
        setMessage({ text: `Added ${quantity} units to ${selectedMedicine.Med_Name}`, type: 'success' });
      } else if (actionType === 'dispose') {
        // Check if trying to dispose more than available
        if (quantity > selectedMedicine.Quantity) {
          setMessage({ 
            text: `Cannot dispose more than available stock (${selectedMedicine.Quantity} units)`, 
            type: 'danger' 
          });
          setLoading(false);
          return;
        }
        
        // Dispose stock API call (would need to be implemented in backend)
        await api.updateMedicineStock(selectedMedicine.Med_ID, {
          Batch_no: selectedMedicine.Batch_no,
          Quantity: quantity,
          action: 'dispose'
        });
        
        setMessage({ text: `Disposed ${quantity} units of ${selectedMedicine.Med_Name}`, type: 'success' });
      }
      
      // Reset form and refresh data
      setShowUpdateForm(false);
      setSelectedMedicine(null);
      setUpdateQuantity('');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error updating stock:', err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to update stock', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      <h2>Inventory Management</h2>
      
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className={`btn me-2 ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('available')}
            style = {{margin:'10px'}}
          >
            Available Medicines
          </button>
          <button 
            className={`btn me-2 ${activeTab === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('expired')}
            style = {{margin:'10px'}}
          >
            Expired Medicines
          </button>
        </div>
        
        <div>
          <button
            className="btn btn-success me-2"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowUpdateForm(false);
            }}
            style = {{margin:'10px'}}
          >
            {showAddForm ? 'Cancel' : 'Add New Medicine'}
          </button>
          
          <button
            className="btn btn-info"
            onClick={() => {
              setShowUpdateForm(!showUpdateForm);
              setShowAddForm(false);
              setSelectedMedicine(null);
            }}
            style = {{margin:'10px'}}
          >
            {showUpdateForm ? 'Cancel' : 'Update Stock'}
          </button>
        </div>
      </div>
      
      {/* Add Medicine Form */}
      {showAddForm && (
        <div className="card p-3 mb-4">
          <form onSubmit={handleAddMedicine}>
            <h3>Add New Medicine</h3>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="Med_Name"
                  value={newMedicine.Med_Name}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label>Manufacturer</label>
                <input
                  type="text"
                  className="form-control"
                  name="Manufacturer"
                  value={newMedicine.Manufacturer}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="Expiry_date"
                  value={newMedicine.Expiry_date}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label>Cost Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="cost_price"
                  value={newMedicine.cost_price}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Batch Number</label>
                <input
                  type="number"
                  className="form-control"
                  name="Batch_no"
                  value={newMedicine.Batch_no}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  name="Quantity"
                  value={newMedicine.Quantity}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Category</label>
                <input
                  type="text"
                  className="form-control"
                  name="Category"
                  value={newMedicine.Category}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label>Batch Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="Batch_price"
                  value={newMedicine.Batch_price}
                  onChange={handleNewMedicineChange}
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </form>
        </div>
      )}
      
      {/* Update Stock Form */}
      {showUpdateForm && (
        <div className="card p-3 mb-4">
          <form onSubmit={handleUpdateStock}>
            <h3>Update Stock</h3>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Select Medicine</label>
                <select
                  className="form-control"
                  value={selectedMedicine?.Med_ID || ''}
                  onChange={(e) => {
                    const selected = medicines.find(med => med.Med_ID === parseInt(e.target.value));
                    setSelectedMedicine(selected || null);
                  }}
                  required
                >
                  <option value="">-- Select Medicine --</option>
                  {medicines.map(med => (
                    <option key={med.Med_ID} value={med.Med_ID}>
                      {med.Med_Name} (Stock: {med.Quantity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-6">
                <label>Action</label>
                <select
                  className="form-control"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  required
                >
                  <option value="add">Add Stock</option>
                  <option value="dispose">Dispose Stock</option>
                </select>
              </div>
            </div>
            
            {selectedMedicine && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <label>Current Stock</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedMedicine.Quantity}
                    readOnly
                  />
                </div>
                
                <div className="col-md-6">
                  <label>Quantity to {actionType === 'add' ? 'Add' : 'Dispose'}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={updateQuantity}
                    onChange={(e) => setUpdateQuantity(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedMedicine}
            >
              {loading ? 'Processing...' : `${actionType === 'add' ? 'Add to' : 'Dispose from'} Stock`}
            </button>
          </form>
        </div>
      )}
      
      {loading && !showAddForm && !showUpdateForm ? (
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
                <div className="table-responsive">
                  <table className="table table-striped">
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map(med => (
                        <tr key={`${med.Med_ID}-${med.Batch_no}`}>
                          <td>{med.Med_ID}</td>
                          <td>{med.Med_Name}</td>
                          <td>{med.Manufacturer}</td>
                          <td>{med.Category}</td>
                          <td>{med.Quantity}</td>
                          <td>{getStockStatus(med.Quantity)}</td>
                          <td>{formatDate(med.Exp_date)}</td>
                          <td>Rs.{med.cost_price}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSelectMedicine(med)}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'expired' && (
            <div className="card">
              <h3>Expired Medicines</h3>
              {expiredMedicines.length === 0 ? (
                <p>No expired medicines found.</p>
              ) : (
                <div className="table-responsive">
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredMedicines.map(med => (
                        <tr key={`${med.Med_ID}-${med.Batch_no}`} style={{ backgroundColor: '#fff3cd' }}>
                          <td>{med.Med_ID}</td>
                          <td>{med.Med_Name}</td>
                          <td>{med.Manufacturer}</td>
                          <td>{med.Category}</td>
                          <td>{med.Quantity}</td>
                          <td>{formatDate(med.Exp_date)}</td>
                          <td>Rs.{med.cost_price}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => {
                                setSelectedMedicine(med);
                                setUpdateQuantity(med.Quantity.toString());
                                setActionType('dispose');
                                setShowUpdateForm(true);
                              }}
                            >
                              Dispose All
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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