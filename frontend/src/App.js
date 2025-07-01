import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SearchFilterProvider } from './context/SearchFilterContext';
// import { SubscriptionProvider } from './context/SubscriptionContext';

// Import pages
import Home from './pages/Home';
import AuthContainer from './pages/AuthContainer';
import BrowsePage from './pages/BrowsePage';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TempAdminLogin from './pages/TempAdminLogin';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Import components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <SearchFilterProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<AuthContainer />} />
              <Route path="/register" element={<AuthContainer />} />
              <Route path="/artist/register" element={<AuthContainer />} />
              
              {/* Common routes */}
              <Route path="/browse" element={<BrowsePage />} />
              
              {/* Temporary Admin Login Route */}
              <Route path="/admin/login" element={<TempAdminLogin />} />
              
              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/artist/dashboard"
                element={
                  <PrivateRoute>
                    <ArtistDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SearchFilterProvider>
    </Router>
  );
}

export default App; 