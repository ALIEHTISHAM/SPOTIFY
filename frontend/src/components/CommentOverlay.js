import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

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
  const [replying, setReplying] = useState({}); // {commentId: bool}
  const [openReplies, setOpenReplies] = useState({}); // {commentId: true/false}
  const [showReplyInput, setShowReplyInput] = useState({}); // {commentId: bool}
  const replyInputRefs = useRef({});
  const [activeReplyInputId, setActiveReplyInputId] = useState(null); // ID of comment or reply being replied to
  const [artist, setArtist] = useState(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [openDescendants, setOpenDescendants] = useState({}); // {replyId: true/false}

  // Fetch all comments for a track as a hierarchy, and artist/track info
  const fetchComments = async () => {
    if (!track?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/comments/track/${track._id}/comments-hierarchical`);
      setComments(res.data.comments || []);
      setArtist(res.data.artist || null);
      setTrackTitle(res.data.trackTitle || '');
    } catch {
      setComments([]);
      setArtist(null);
      setTrackTitle('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !track?._id) return;
    fetchComments();
    setOpenReplies({}); // Hide all replies by default when overlay opens or track changes
  }, [open, track]);

  // Add a new top-level comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/comments/track/${track._id}/add`, {
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

  // Add a reply to a comment or reply (attach to the actual parent)
  const handleAddReply = async (parentId) => {
    const replyText = replyInputs[parentId]?.trim();
    if (!replyText) return;
    setReplying(r => ({ ...r, [parentId]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/comments/comment/${parentId}/reply`, {
        trackId: track._id,
        text: replyText,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setReplyInputs(i => ({ ...i, [parentId]: '' }));
      setActiveReplyInputId(null); // Hide input after reply
      await fetchComments(); // Refresh comments
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding reply');
    } finally {
      setReplying(r => ({ ...r, [parentId]: false }));
    }
  };

  // New: handle reply to a top-level comment (pre-fill @ParentUserName)
  const handleReplyToComment = (commentId, parentUserName) => {
    setReplyInputs(inputs => ({
      ...inputs,
      [commentId]: inputs[commentId]?.startsWith(`@${parentUserName} `)
        ? inputs[commentId]
        : `@${parentUserName} `
    }));
    setActiveReplyInputId(currentId => {
      if (currentId === commentId) return null; // Toggle off if already open
      setTimeout(() => {
        const input = replyInputRefs.current[commentId];
        if (input) {
          input.focus();
          const val = input.value;
          input.setSelectionRange(val.length, val.length);
        }
      }, 0);
      return commentId;
    });
  };

  // New: handle reply to a reply (pre-fill @username in the parent comment's reply input)
  const handleReplyToReply = (parentCommentId, replyId, replyUserName) => {
    setReplyInputs(inputs => ({
      ...inputs,
      [replyId]: inputs[replyId]?.startsWith(`@${replyUserName} `)
        ? inputs[replyId]
        : `@${replyUserName} `
    }));
    setActiveReplyInputId(currentId => {
      if (currentId === replyId) return null; // Toggle off if already open
      setTimeout(() => {
        const input = replyInputRefs.current[replyId];
        if (input) {
          input.focus();
          const val = input.value;
          input.setSelectionRange(val.length, val.length);
        }
      }, 0);
      return replyId;
    });
  };

  // Toggle replies for a comment
  const handleToggleReplies = async (commentId) => {
    setOpenReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Add this function below handleToggleReplies
  const handleToggleDescendants = (replyId) => {
    setOpenDescendants(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  // Helper: Render reply text with styled @username if present
  function renderReplyText(text) {
    if (typeof text !== 'string') return '';
    const match = text.match(/^@(\S+)\s(.*)$/);
    if (match) {
      return (
        <>
          <span style={{ color: '#1e90ff', fontWeight: 500 }}>{`@${match[1]}`}</span>{' '}{match[2]}
        </>
      );
    }
    return text;
  }

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
          <span>{trackTitle} — {artist?.name} ({artist?.numTracks} {artist?.numTracks === 1 ? 'track' : 'tracks'})</span>
          <span></span>
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
                <div style={{ marginTop: '0.2rem', color: '#fff' }}>{c.content ?? c.text}</div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1.2rem', marginTop: '0.3rem' }}>
                  <button
                    style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', fontSize: '0.95em' }}
                    onClick={() => handleReplyToComment(c._id, c.user?.name || 'User')}
                  >
                    Reply
                  </button>
                  {(c.replies?.length > 0) && (
                <button
                      style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', fontSize: '0.95em' }}
                  onClick={() => handleToggleReplies(c._id)}
                >
                  {openReplies[c._id] ? 'Hide Replies' : 'View Replies'}
                </button>
                  )}
                </div>
                {/* Show reply input below parent comment if active */}
                {activeReplyInputId === c._id && (
                  <div style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                    <textarea
                      ref={el => (replyInputRefs.current[c._id] = el)}
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
                {/* Replies: only two levels of indentation, all descendants flat under each direct reply */}
                {openReplies[c._id] && (
                  <div style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                    {(c.replies || []).map(reply => (
                      <div key={reply._id} style={{ marginBottom: '0.7rem' }}>
                        <b style={{ color: '#1db954' }}>{reply.user?.name || 'User'}</b>
                        <div style={{ color: '#fff' }}>{renderReplyText(reply.content ?? reply.text)}</div>
                        <button
                          style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', fontSize: '0.92em', marginLeft: '0.5rem' }}
                          onClick={() => handleReplyToReply(c._id, reply._id, reply.user?.name || 'User')}
                        >
                          Reply
                        </button>
                        {/* Toggle descendants button */}
                        {(reply.descendants && reply.descendants.length > 0) && (
                          <button
                            style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', fontSize: '0.92em', marginLeft: '0.5rem' }}
                            onClick={() => handleToggleDescendants(reply._id)}
                          >
                            {openDescendants[reply._id] ? 'Hide Replies' : 'View Replies'}
                          </button>
                        )}
                        {activeReplyInputId === reply._id && (
                          <div style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                            <textarea
                              ref={el => (replyInputRefs.current[reply._id] = el)}
                              style={replyInputStyle}
                              placeholder="Write a reply..."
                              value={replyInputs[reply._id] || ''}
                              onChange={e => setReplyInputs(i => ({ ...i, [reply._id]: e.target.value }))}
                            />
                            <button
                              style={{ background: '#1db954', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 1rem', cursor: 'pointer', marginTop: '0.2rem' }}
                              onClick={() => handleAddReply(reply._id)}
                              disabled={replying[reply._id]}
                            >
                              {replying[reply._id] ? 'Replying...' : 'Reply'}
                            </button>
                          </div>
                        )}
                        {/* Render all descendants of this reply (flat, no further nesting) with toggle */}
                        {openDescendants[reply._id] && (reply.descendants || []).map(descendant => (
                          <div key={descendant._id} style={{ marginLeft: '1.2rem', marginTop: '0.5rem', marginBottom: '0.7rem', background: 'rgba(30,200,30,0.08)', borderRadius: '4px', padding: '0.3rem 0.5rem' }}>
                            <b style={{ color: '#1db954' }}>{descendant.user?.name || 'User'}</b>
                            <div style={{ color: '#fff' }}>{renderReplyText(descendant.content ?? descendant.text)}</div>
                            <button
                              style={{ background: 'none', color: '#1e90ff', border: 'none', cursor: 'pointer', fontSize: '0.92em', marginLeft: '0.5rem' }}
                              onClick={() => handleReplyToReply(reply._id, descendant._id, descendant.user?.name || 'User')}
                            >
                              Reply
                            </button>
                            {activeReplyInputId === descendant._id && (
                              <div style={{ marginLeft: '1.2rem', marginTop: '0.5rem' }}>
                                <textarea
                                  ref={el => (replyInputRefs.current[descendant._id] = el)}
                                  style={replyInputStyle}
                                  placeholder="Write a reply..."
                                  value={replyInputs[descendant._id] || ''}
                                  onChange={e => setReplyInputs(i => ({ ...i, [descendant._id]: e.target.value }))}
                                />
                                <button
                                  style={{ background: '#1db954', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 1rem', cursor: 'pointer', marginTop: '0.2rem' }}
                                  onClick={() => handleAddReply(descendant._id)}
                                  disabled={replying[descendant._id]}
                                >
                                  {replying[descendant._id] ? 'Replying...' : 'Reply'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
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