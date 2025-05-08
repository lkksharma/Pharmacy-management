import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Array of background pharmacy/medicine images
  const bgImages = [
    'https://images.unsplash.com/photo-1631549916768-4119b4123a8c?q=80&w=1920',
    'https://images.unsplash.com/photo-1573883431205-98b5f10aaedb?q=80&w=1920',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1920',
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=1920',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=1920'
  ];

  // Effect to cycle through background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Navigation items
  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'Place Order', path: '/order' },
    { title: 'Inventory Management', path: '/inventory' },
    { title: 'Appraisal', path: '/appraisal' }
  ];

  return (
    <div className="main-container">
      {/* Background image slider with overlay */}
      <div 
        className="bg-image-container"
        style={{
          backgroundImage: `url(${bgImages[currentImageIndex]})`,
          transition: 'background-image 1s ease-in-out'
        }}
      >
        <div className="overlay"></div>
      </div>

      {/* Navigation header */}
      <header className="navbar">
        {/* <div className="navbar-brand">Pharmacy Management System</div> */}
        <nav className="navbar-nav">
          {navItems.map((item, index) => (
            <button 
              key={index}
              className="nav-item" 
              onClick={() => navigate(item.path)}
            >
              {item.title}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <div className="content">
        <div className="welcome-card">
          <h1>Welcome to Pharmacy Management System</h1>
          <p>Please select an option to continue:</p>
          
          <div className="action-buttons">
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
    </div>
  );
}

export default HomePage;