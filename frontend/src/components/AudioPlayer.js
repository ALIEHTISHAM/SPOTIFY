/**
 * AudioPlayer component
 * ---------------------
 * Handles all audio playback logic and state locally.
 * Memoized with React.memo to prevent unnecessary re-renders.
 * [Optimization] Playback state is now fully internal.
 * Only re-renders on track change, not on play/pause/seek.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTrack } from '../context/TrackContext';

const AudioPlayer = React.memo(function AudioPlayer({ initialVolume = 1 }) {
  const { selectedTrack } = useTrack();
  // --- RENDER OPTIMIZATION ---
  // isPlaying and all playback logic are internal.
  // This prevents parent re-renders on play/pause/seek.
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const prevTrackId = useRef(null);
  const shouldAutoPlay = useRef(false);

  // --- RENDER OPTIMIZATION ---
  // When track changes, reset state and auto-play.
  // This ensures AudioPlayer only re-renders on track change.
  useEffect(() => {
    if (!selectedTrack) return;
    if (prevTrackId.current !== selectedTrack._id) {
      setIsPlaying(true);
      setCurrentTime(0);
      prevTrackId.current = selectedTrack._id;
      shouldAutoPlay.current = true;
    }
  }, [selectedTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      // Only play if metadata is loaded
      if (!audioRef.current.paused && !audioRef.current.ended) return;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, selectedTrack]);

  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current.duration);
    // Auto-play if flagged
    if (shouldAutoPlay.current) {
      audioRef.current.play().catch(() => {});
      shouldAutoPlay.current = false;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleSeek = useCallback((e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    audioRef.current.volume = vol;
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!selectedTrack) return null;

  return (
    <div className="music-player">
      {/* --- RENDER OPTIMIZATION ---
          All playback controls and state are internal to AudioPlayer. */}
      <div className="player-info">
        <div className="track-cover-container">
          <img
            src={selectedTrack.coverImage || ''}
            alt={selectedTrack.title}
            className="track-cover"
          />
        </div>
        <div className="track-details">
          <h3>{selectedTrack.title}</h3>
          <p>{selectedTrack.artist?.name || 'Unknown Artist'}</p>
        </div>
      </div>
      <div className="volume-controls">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
      <div className="player-controls">
        <div className="control-buttons">
          <button className="control-button play-pause" onClick={handlePlayPause}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
        </div>
        <div className="progress-bar">
          <span className="time-info">{formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="progress-slider"
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={selectedTrack.audioFile}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
});

export default AudioPlayer;