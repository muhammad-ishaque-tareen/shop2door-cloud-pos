import React, { useState, useEffect } from 'react';
import '../styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate =useNavigate();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '#contact' },
     { name: 'About', href: '/about', isRoute: true }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-text">SHOP2DOOR LOGO</span>
        </div>

        <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link, index) => (
            <li key={index}>
              <a href={link.href} onClick={() => setIsMenuOpen(false)}>
                {link.name}
              </a>
            </li>
          ))}
          <li className="mobile-login-item">
            <button className="mobile-login-btn" onClick={handleLoginClick}>
              <span>Login</span>
            </button>
          </li>
        </ul>

        <button className="btn-login desktop-only" onClick={handleLoginClick}>
          <span>LOGIN</span>
        </button>

        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;