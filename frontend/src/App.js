import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SearchFilterProvider } from './context/SearchFilterContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TrackProvider } from './context/TrackContext';

// Import pages
import Home from './pages/Home';
import AuthContainer from './pages/AuthContainer';
import BrowsePage from './pages/BrowsePage';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Import components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Footer from './components/Footer';

// This component contains the main app layout and routing
const AppContent = () => {
  return (
    <Router>
      <SubscriptionProvider>
        <TrackProvider>
          <SearchFilterProvider>
            <div className="app">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<AuthContainer />} />
                  <Route path="/register" element={<AuthContainer />} />
                  <Route path="/artist/register" element={<AuthContainer />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/dashboard" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/artist/dashboard" element={<PrivateRoute><ArtistDashboard /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </SearchFilterProvider>
        </TrackProvider>
      </SubscriptionProvider>
    </Router>
  );
};

// This is the main App component that handles the auth loading state
function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return <AppContent />;
}

export default App; 