import React from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import '../styles/WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <Navbar />
      <section className="hero-section">
        <div className="hero-wrapper">
          <div className="hero-circles">
            <div className="circle-large"></div>
            <div className="circle-dark"></div>
            <div className="circle-pink-small"></div>
            <div className="circle-blue"></div>
            <div className="circle-pink-medium"></div>
          </div>
          <div className="hero-content">
            <h2 className="hero-title">WELCOME TO SHOP2DOOR</h2>
            
            <p className="hero-description">
              Shop2Door POS is a simple and reliable point-of-sale system that helps shops manage sales, products, inventory, and customers quickly and easily.
            </p>
            
            <p className="hero-description">
              Shop2Door POS is a simple and reliable point-of-sale system that helps shops manage sales, products, inventory, and customers quickly and easily.
            </p>

            <button 
              className="buy-shop2door-btn"
              onClick={() => navigate("/pricing")}
            >
              BUY SHOP2DOOR
            </button>
          </div>
        </div>
        <div className="hero-indicators">
          <div className="indicator"></div>
          <div className="indicator"></div>
          <div className="indicator"></div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;