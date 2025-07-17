import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ArtistDashboard.css';

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [uploadedTracks, setUploadedTracks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    genre: '',
    audioFile: null,
    coverImage: null
  });

  // Fetch artist's uploaded tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/artist/tracks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUploadedTracks(data);
        }
      } catch (error) {
        // console.error('Error fetching tracks:', error);
      }
    };

    fetchTracks();
  }, []);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('genre', uploadForm.genre);
      formData.append('audioFile', uploadForm.audioFile);
      formData.append('coverImage', uploadForm.coverImage);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/artist/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const newTrack = await response.json();
      setUploadedTracks(prev => [...prev, newTrack.track]);
      setUploadForm({
        title: '',
        genre: '',
        audioFile: null,
        coverImage: null
      });
    } catch (error) {
      // console.error('Upload error:', error);
      alert(error.message || 'Failed to upload track. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  // Get the artist name from the user object
  const artistName = user?.artistProfile?.artistName || user?.name || 'Artist';

  return (
    <div className="artist-dashboard">
      <h1>Welcome, {artistName}!</h1>
      
      {/* Upload Section */}
      <section className="upload-section">
        <h2>Upload New Track</h2>
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Track Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={uploadForm.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={uploadForm.genre}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="audioFile">Audio File</label>
            <input
              type="file"
              id="audioFile"
              name="audioFile"
              accept="audio/*"
              onChange={handleFileChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="coverImage">Cover Image</label>
            <input
              type="file"
              id="coverImage"
              name="coverImage"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Track'}
          </button>
        </form>
      </section>

      {/* Tracks Section */}
      <section className="tracks-section">
        <h2>Your Tracks</h2>
        <div className="tracks-grid">
          {uploadedTracks.map(track => {
            // Remove all console.log and console.error statements

            // Construct and log the image URL
            const imageUrl = `http://localhost:5000/${track.coverImage}`;

            // Construct and log the audio URL
            const audioUrl = `http://localhost:5000/${track.audioFile}`;

            return (
              <div key={track._id} className="track-card">
                <div className="track-cover-container">
                  <img 
                    src={imageUrl}
                    alt={track.title} 
                    className="track-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-cover.png';
                    }}
                  />
                </div>
                <div className="track-info">
                  <h3>{track.title}</h3>
                  <p className="genre">{track.genre}</p>
                  <p className="artist-name">Artist: {track.artist ? (track.artist.artistProfile?.artistName || track.artist.name) : 'Unknown'}</p>
                  <div className={`status-badge ${getStatusBadgeClass(track.status)}`}>
                    {track.status}
                  </div>
                  {track.adminFeedback && (
                    <p className="admin-feedback">Admin Feedback: {track.adminFeedback}</p>
                  )}
                  <audio controls>
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ArtistDashboard; 