## [2024-06-10] Audio Player Render Optimization

- Extracted AudioPlayer from BrowsePage to prevent unnecessary re-renders.
- Only selectedTrack is managed in BrowsePage; all playback state is internal to AudioPlayer.
- Track list now only starts/restarts a song; play/pause is controlled from the player.
- Updated CSS for a compact, row-based track list layout.
- Result: Only AudioPlayer re-renders on playback actions, improving performance and UX. 