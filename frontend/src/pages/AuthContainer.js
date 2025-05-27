import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ArtistRegister from './ArtistRegister';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContainer = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'userRegister', 'artistRegister'
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/login') {
      setAuthMode('login');
    } else if (location.pathname === '/register') {
      setAuthMode('userRegister');
    } else if (location.pathname === '/artist/register') {
      setAuthMode('artistRegister');
    }
  }, [location.pathname]);

  const handleSuccessfulRegistration = () => {
    setRegistrationSuccess(true);
    setAuthMode('login');
    setShowSuccessMessage(true);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setRegistrationSuccess(false);
    setShowSuccessMessage(false);
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setAuthMode('userRegister');
    setRegistrationSuccess(false);
    setShowSuccessMessage(false);
    navigate('/register');
  };

  const handleArtistRegisterClick = () => {
    setAuthMode('artistRegister');
    setRegistrationSuccess(false);
    setShowSuccessMessage(false);
    navigate('/artist/register');
  };

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  return (
    <div className={`auth-container ${authMode !== 'login' ? 'register-mode' : 'login-mode'}`}>
      <div className="art-section">
        <div className="art-content">
          {registrationSuccess ? (
             <>
              <h2>Welcome!</h2>
              <p>You have successfully registered. Please login to continue.</p>
             </>
          ) : (
            <>
              <div className="logo">THEGOOD NETWORK</div>
              <h2>We are Invite only right now.</h2>
              <p>10 Million+ people have joined our network. We invite you to join the tribe.</p>
              {authMode !== 'login' ? (
                <p>Already have an account? <span className="auth-switch-link" onClick={handleLoginClick}>Sign in</span></p>
              ) : (
                <p>Don't have an account? <span className="auth-switch-link" onClick={handleRegisterClick}>Sign up</span></p>
              )}
              {authMode !== 'artistRegister' && authMode !== 'login' && (
                <p>Are you an artist? <span className="auth-switch-link" onClick={handleArtistRegisterClick}>Register as Artist</span></p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="form-section">
        {authMode === 'login' && <Login showSuccessMessage={showSuccessMessage} />}
        {authMode === 'userRegister' && <Register onSuccess={handleSuccessfulRegistration} />}
        {authMode === 'artistRegister' && <ArtistRegister onSuccess={handleSuccessfulRegistration} />}
      </div>
    </div>
  );
};

export default AuthContainer; 