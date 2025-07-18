import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShowPasswordChange = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        onSuccess();
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign up</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Set password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input type="checkbox" id="showPassword" checked={showPassword} onChange={handleShowPasswordChange} />
          <label htmlFor="showPassword">Show password</label>
        </div>
        <button type="submit" className="btn btn-primary">
          Sign up
        </button>
      </form>
      {/* Auth switch links for mobile */}
      <div className="auth-links mobile-only">
        <p>
          Already have an account?{' '}
          <span className="auth-switch-link" onClick={() => navigate('/login')}>Sign in</span>
        </p>
        <p>
          Are you an artist?{' '}
          <span className="auth-switch-link" onClick={() => navigate('/artist/register')}>Register as Artist</span>
        </p>
      </div>
    </div>
  );
};

export default Register; 