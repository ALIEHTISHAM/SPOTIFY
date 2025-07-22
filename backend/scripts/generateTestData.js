// generateTestData.js
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const path = require('path');
const fs = require('fs');
const { faker } = require('@faker-js/faker');
const User = require('../src/models/User');
const Track = require('../src/models/Track');

const CRED_FILE = path.join(__dirname, 'generated_credentials.txt');

// S3 URLs for audio and images (replace with your actual S3 URLs)
const audioFiles = [
  'https://myspotify-audio-files.s3.amazonaws.com/audio/1752835927910_rapgod.mp3',
  'https://myspotify-audio-files.s3.amazonaws.com/audio/1753097048751_Pop_Smoke_-_Dior.mp3',
  'https://myspotify-audio-files.s3.amazonaws.com/audio/1753097172033_Pop_Smoke_-_Dior.mp3',
  'https://myspotify-audio-files.s3.amazonaws.com/audio/1753097406744_Kendrick+Lamar++squabble+up.mp3',
  'https://myspotify-audio-files.s3.amazonaws.com/audio/1753097469753_rapgod.mp3',
];
const imageFiles = [
  'https://myspotify-audio-files.s3.amazonaws.com/images/1753097471096_emineml.jpg',
  'https://myspotify-audio-files.s3.amazonaws.com/images/1753097409065_kendrick.jpg',
  'https://myspotify-audio-files.s3.amazonaws.com/images/1753097173102_50.jpeg',
  'https://myspotify-audio-files.s3.amazonaws.com/images/1753097049869_pop.jpeg',
  'https://myspotify-audio-files.s3.amazonaws.com/images/1752835930996_mee.jpg',
];

const NUM_ARTISTS = 5;
const NUM_TRACKS = 10000;

async function main() {
  await connectDB();
  console.log('Connected to DB');

  // Prepare credential log
  fs.writeFileSync(CRED_FILE, 'EMAIL,PASSWORD,ROLE\n');

  // 1. Create artists
  const artists = [];
  for (let i = 0; i < NUM_ARTISTS; i++) {
    const artistName = faker.person.fullName();
    const email = `artist${Date.now()}_${i}@example.com`;
    const password = 'password123';
    const artist = await User.create({
      email,
      password,
      name: artistName,
      role: 'artist',
      artistProfile: { artistName: faker.music.songName(), verified: false },
      subscription: {},
    });
    artists.push(artist);
    fs.appendFileSync(CRED_FILE, `${email},${password},artist\n`);
  }

  // 2. Bulk create tracks
  const tracks = [];
  for (let i = 0; i < NUM_TRACKS; i++) {
    const artist = artists[i % artists.length];
    tracks.push({
      title: faker.music.songName(),
      artist: artist._id,
      genre: faker.music.genre(),
      audioFile: audioFiles[i % audioFiles.length],
      coverImage: imageFiles[i % imageFiles.length],
      status: 'approved',
      uploadDate: new Date(),
      adminFeedback: '',
    });
  }
  await Track.insertMany(tracks);
  console.log(`Inserted ${NUM_ARTISTS} artists and ${NUM_TRACKS} tracks!`);
  mongoose.connection.close();
  process.exit();
}

main(); 