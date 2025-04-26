import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OrderPage from './pages/OrderPage';
import InventoryPage from './pages/InventoryPage';
import Header from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;