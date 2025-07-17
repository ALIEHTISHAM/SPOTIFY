import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrackCard = React.memo(function TrackCard({ track, isSelected, onSelect, onOpenComments }) {

  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`http://localhost:5000/api/like/check-liked/${track._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiked(res.data.liked);
      } catch (err) {
        setLiked(false); // fallback
      }
    };
    fetchLikeStatus();
  }, [track._id]);

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent triggering play/select
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!liked) {
        await axios.post('http://localhost:5000/api/like/like', { trackId: track._id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiked(true);
      } else {
        await axios.post('http://localhost:5000/api/like/unlike', { trackId: track._id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiked(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating like status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`track-card ${isSelected ? 'playing' : ''}`}
      onClick={() => onSelect(track)}
      style={{ cursor: 'pointer' }}
    >
      <div className="track-cover-container">
        <img
          src={`http://localhost:5000/${track.coverImage}`}
          alt={track.title}
          className="track-cover"
        />

      </div>
      <div className="track-info">
        <h3>{track.title}</h3>
        <p>{track.artist?.name || 'Unknown Artist'}</p>
        <p className="genre">{track.genre}</p>
      </div>
      <button
          className={`like-button${liked ? ' liked' : ''}`}
          onClick={handleLike}
          disabled={loading}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          {liked ? '♥' : '♡'}
        </button>
      <button
        className="comment-button"
        onClick={e => { e.stopPropagation(); onOpenComments(track); }}
        aria-label="Comment"
      >
        {'💬'}
      </button>
    </div>
  );
});

export default TrackCard; 