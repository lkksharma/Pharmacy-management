import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header style={{ 
      backgroundColor: '#333', 
      color: 'white', 
      padding: '20px 0',
      marginBottom: '20px'
    }}>
      <div className="container">
        <h1 style={{ margin: 0 }}>Pharmacy Management System</h1>
        <nav style={{ marginTop: '10px' }}>
          <Link to="/" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>
            Home
          </Link>
          <Link to="/order" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>
            Place Order
          </Link>
          <Link to="/inventory" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>
            Inventory Management
          </Link>
          <Link to="/appraisal" style={{ color: 'white', textDecoration: 'none' }}>
            Appraisal
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
