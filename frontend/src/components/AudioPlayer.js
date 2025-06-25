/**
 * AudioPlayer component
 * ---------------------
 * Handles all audio playback logic and state locally.
 * Memoized with React.memo to prevent unnecessary re-renders.
 * [Optimization] Playback state is now fully internal.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';

const AudioPlayer = React.memo(function AudioPlayer({
  track,
  initialVolume = 1
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const prevTrackId = useRef(null);

  // When track changes, reset state and auto-play
  useEffect(() => {
    if (!track) return;
    if (prevTrackId.current !== track._id) {
      setIsPlaying(true);
      setCurrentTime(0);
      prevTrackId.current = track._id;
    }
  }, [track]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, track]);

  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current.duration);
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

  if (!track) return null;

  return (
    <div className="music-player">
      <div className="player-info">
        <div className="track-cover-container">
          <img
            src={track.coverImage ? `http://localhost:5000/${track.coverImage}` : ''}
            alt={track.title}
            className="track-cover"
          />
        </div>
        <div className="track-details">
          <h3>{track.title}</h3>
          <p>{track.artist?.name || 'Unknown Artist'}</p>
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
          <span className="time-info">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="progress-slider"
          />
          <span className="time-info">{formatTime(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={track.audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
});

export default AudioPlayer;