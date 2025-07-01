import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.3)',
  zIndex: 2000,
  display: 'flex',
  justifyContent: 'flex-end',
};

const drawerStyle = {
  width: 'min(400px, 100vw)',
  maxWidth: '100vw',
  height: '100vh',
  background: '#181818',
  boxShadow: '-2px 0 16px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  animation: 'slideInRight 0.2s',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem',
  borderBottom: '1px solid #222',
  background: '#222',
};

const commentsListStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '1rem',
  color: 'white',
};

const inputSectionStyle = {
  borderTop: '1px solid #222',
  padding: '1rem',
  background: '#222',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '1.5rem',
  cursor: 'pointer',
};

const replyInputStyle = {
  width: '100%',
  minHeight: '40px',
  borderRadius: '6px',
  padding: '0.3rem',
  border: '1px solid #444',
  background: '#222',
  color: 'white',
  marginTop: '0.3rem',
  marginBottom: '0.3rem',
};

function CommentOverlay({ open, onClose, track }) {
  const drawerRef = useRef();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyInputs, setReplyInputs] = useState({}); // {commentId: replyText}
  const [replies, setReplies] = useState({}); // {commentId: [replies]}
  const [replying, setReplying] = useState({}); // {commentId: bool}
  const [openReplies, setOpenReplies] = useState({}); // {commentId: true/false}

  // Fetch top-level comments when overlay opens or track changes
  const fetchComments = async () => {
    if (!track?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/track/${track._id}/comments`);
      setComments(res.data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !track?._id) return;
    fetchComments();
  }, [open, track]);

  // Fetch replies for a comment
  const fetchReplies = async (commentId) => {
    if (replies[commentId]) return; // Already loaded
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/comment/${commentId}/replies`);
      setReplies(r => ({ ...r, [commentId]: res.data.replies || [] }));
    } catch {
      setReplies(r => ({ ...r, [commentId]: [] }));
    }
  };

  // Add a new top-level comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/comments/track/${track._id}/add`, {
        text: newComment.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewComment('');
      await fetchComments(); // Re-fetch all comments from backend
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding comment');
    } finally {
      setLoading(false);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (commentId) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText) return;
    setReplying(r => ({ ...r, [commentId]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/comments/comment/${commentId}/reply`, {
        trackId: track._id,
        text: replyText,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setReplyInputs(i => ({ ...i, [commentId]: '' }));
      await fetchReplies(commentId); // Re-fetch all replies for this comment
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding reply');
    } finally {
      setReplying(r => ({ ...r, [commentId]: false }));
    }
  };

  // Toggle replies for a comment
  const handleToggleReplies = async (commentId) => {
    setOpenReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    if (!openReplies[commentId] && !replies[commentId]) {
      await fetchReplies(commentId);
    }
  };

  if (!open) return null;

  function handleOverlayClick(e) {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose();
    }
  }

  return (
    <div style={overlayStyle} onMouseDown={handleOverlayClick}>
      <div style={drawerRef ? drawerStyle : {}} ref={drawerRef} onMouseDown={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span><b>Comments</b> — {track?.title}</span>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        </div>
        <div style={commentsListStyle}>
          {loading ? <p style={{ color: '#aaa' }}>Loading...</p> : null}
          {!loading && comments.length === 0 ? (
            <p style={{ color: '#aaa' }}>No comments yet. Be the first to comment!</p>
          ) : (
            comments.map(c => (
              <div key={c._id} style={{ marginBottom: '1.2rem', borderBottom: '1px solid #222', paddingBottom: '0.7rem' }}>
                <b style={{ color: '#1db954' }}>{c.user?.name || 'User'}</b>
                <div style={{ marginTop: '0.2rem', color: '#fff' }}>{c.text}</div>
                <button
                  style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', marginTop: '0.3rem', fontSize: '0.95em' }}
                  onClick={() => handleToggleReplies(c._id)}
                >
                  {openReplies[c._id] ? 'Hide Replies' : 'View Replies'}
                </button>
                {/* Replies */}
                {openReplies[c._id] && replies[c._id] && (
                  <div style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                    {replies[c._id].length === 0 ? (
                      <span style={{ color: '#aaa' }}>No replies yet.</span>
                    ) : (
                      replies[c._id].map(r => (
                        <div key={r._id} style={{ marginBottom: '0.7rem' }}>
                          <b style={{ color: '#1db954' }}>{r.user?.name || 'User'}</b>
                          <div style={{ color: '#fff' }}>{r.text}</div>
                        </div>
                      ))
                    )}
                    {/* Reply input */}
                    <textarea
                      style={replyInputStyle}
                      placeholder="Write a reply..."
                      value={replyInputs[c._id] || ''}
                      onChange={e => setReplyInputs(i => ({ ...i, [c._id]: e.target.value }))}
                    />
                    <button
                      style={{ background: '#1db954', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 1rem', cursor: 'pointer', marginTop: '0.2rem' }}
                      onClick={() => handleAddReply(c._id)}
                      disabled={replying[c._id]}
                    >
                      {replying[c._id] ? 'Replying...' : 'Reply'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div style={inputSectionStyle}>
          <textarea
            placeholder="Write your comment..."
            style={{ width: '100%', minHeight: '60px', borderRadius: '6px', padding: '0.5rem', border: '1px solid #444', background: '#181818', color: 'white', resize: 'vertical' }}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <button
            style={{ background: '#1db954', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', cursor: 'pointer', alignSelf: 'flex-end' }}
            onClick={handleAddComment}
            disabled={loading}
          >
            {loading ? 'Commenting...' : 'Comment'}
          </button>
        </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      </div>
    </div>
  );
}

export default CommentOverlay; 