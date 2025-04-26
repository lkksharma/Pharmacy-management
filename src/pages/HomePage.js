import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <div className="card">
        <h2>Welcome to Pharmacy Management System</h2>
        <p>Please select an option to continue:</p>
        
        <div className="mt-4">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/order')}
          >
            Place Order
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/inventory')}
          >
            Inventory Management
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;