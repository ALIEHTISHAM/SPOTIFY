import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboard.css'; // Import the CSS file

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingTracks, setPendingTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState({});
  const [showFeedbackInput, setShowFeedbackInput] = useState({});

  // Fetch artist's uploaded tracks
  useEffect(() => {
    const fetchPendingTracks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/admin/tracks/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch pending tracks');
        }

        const data = await response.json();
        setPendingTracks(data);
        setLoading(false);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Fetch tracks only if the user is authenticated and is admin
    if (user && user.role === 'admin') {
      fetchPendingTracks();
    } else if (!user) {
       setLoading(false); // Not authenticated
    } else {
       setLoading(false); // Authenticated but not admin
    }

  }, [user]); // Re-run effect if user changes

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (user.role !== 'admin') {
    return <div>Access Denied. You do not have administrative privileges.</div>;
  }

  // Handlers for approve and reject actions
  const handleApprove = async (trackId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/tracks/${trackId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve track');
      }

      // Remove the approved track from the pending list
      setPendingTracks(pendingTracks.filter(track => track._id !== trackId));
      alert('Track approved successfully!');

    } catch (error) {
      alert(`Failed to approve track: ${error.message}`);
    }
  };

  const handleRejectClick = (trackId) => {
    setShowFeedbackInput(prev => ({
      ...prev,
      [trackId]: true
    }));
  };

  const handleCancelReject = (trackId) => {
    setShowFeedbackInput(prev => ({
      ...prev,
      [trackId]: false
    }));
    setRejectionFeedback(prev => ({
      ...prev,
      [trackId]: ''
    }));
  };

  const handleFeedbackChange = (trackId, value) => {
    setRejectionFeedback(prev => ({
      ...prev,
      [trackId]: value
    }));
  };

  const handleReject = async (trackId) => {
    const feedback = rejectionFeedback[trackId] || ''; // Get feedback for this track
    if (!feedback.trim()) {
      alert('Please provide feedback for rejection.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/tracks/${trackId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject track');
      }

      // Remove the rejected track from the pending list
      setPendingTracks(pendingTracks.filter(track => track._id !== trackId));
      // Clear feedback for this track
      setRejectionFeedback(prev => {
        const newState = { ...prev };
        delete newState[trackId];
        return newState;
      });
      alert('Track rejected successfully!');

    } catch (error) {
      alert(`Failed to reject track: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading pending tracks...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <ul className="pending-tracks">
        {pendingTracks.map(track => (
          <li key={track._id} className="pending-track">
            <div className="track-info">
              <h3>{track.title}</h3>
              <p>Artist: {track.artist ? (track.artist.artistProfile?.artistName || track.artist.name) : 'Unknown Artist'}</p>
              <p>Genre: {track.genre}</p>
            </div>
            <div className="track-actions">
              <button
                className="approve-button"
                onClick={() => handleApprove(track._id)}
                disabled={loading}
              >
                Approve
              </button>
              {!showFeedbackInput[track._id] ? (
                <button
                  className="reject-button"
                  onClick={() => handleRejectClick(track._id)}
                  disabled={loading}
                >
                  Reject
                </button>
              ) : (
                <div className="feedback-container">
                  <textarea
                    className="feedback-input"
                    placeholder="Enter rejection feedback..."
                    value={rejectionFeedback[track._id] || ''}
                    onChange={(e) => handleFeedbackChange(track._id, e.target.value)}
                  />
                  <div className="feedback-actions">
                    <button
                      className="submit-reject-button"
                      onClick={() => handleReject(track._id)}
                      disabled={!rejectionFeedback[track._id]?.trim()}
                    >
                      Submit Rejection
                    </button>
                    <button
                      className="cancel-reject-button"
                      onClick={() => handleCancelReject(track._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard; 