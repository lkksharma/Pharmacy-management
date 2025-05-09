import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  
  // Function to determine if a link is active
  const isActive = (path) => location.pathname === path;
  
  return (
    <>
      {/* Add a placeholder div to prevent content from hiding behind the fixed header */}
      <div style={{ height: '84px' }}></div>
      
      <header style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '22px 0',  // Increased from 20px to 22px (+2px top and bottom = +4px total)
        position: 'fixed',  // Make the header fixed
        top: 0,             // Position at the top
        left: 0,            // Align to the left edge
        right: 0,           // Span the full width
        zIndex: 1000,       // Ensure header stays on top of other content
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Optional: add shadow for visual separation
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          columnGap: '16px', // Add explicit spacing between flex items
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h1 style={{ margin: 0, marginRight: '12px' }}>Pharmacy Management System</h1>

          <nav style={{ display: 'flex', gap: '20px' }}>
            {[
              { path: '/', label: 'Home' },
              { path: '/order', label: 'Place Order' },
              { path: '/inventory', label: 'Inventory Management' },
              { path: '/appraisal', label: 'Appraisal' }
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  color: isActive(path) ? '#4fc3f7' : 'white',
                  textDecoration: 'none',
                  fontWeight: isActive(path) ? 'bold' : 'normal',
                  transition: 'all 0.3s ease',
                  padding: '5px 10px'
                }}
                onMouseEnter={(e) => e.target.style.color = 'green'}
                onMouseLeave={(e) => {
                  e.target.style.color = isActive(path) ? '#4fc3f7' : 'white';
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

export default Header;