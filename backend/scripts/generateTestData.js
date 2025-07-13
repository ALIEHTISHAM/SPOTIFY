// generateTestData.js
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const User = require('../src/models/User');
const Track = require('../src/models/Track');
const Comment = require('../src/models/Comment');
const Like = require('../src/models/Like');

const AUDIO_DIR = path.join(__dirname, '../uploads/audio');
const IMAGE_DIR = path.join(__dirname, '../uploads/images');
const CRED_FILE = path.join(__dirname, 'generated_credentials.txt');

const NUM_ARTISTS = 10;
const NUM_USERS = 20;
const TOTAL_TRACKS = 20000;
const COMMENTS_PER_TRACK_MIN = 20;
const COMMENTS_PER_TRACK_MAX = 40;
const BATCH_SIZE = 1000;

async function main() {
  await connectDB();
  console.log('Connected to DB');

  // Clean up collections
  await User.deleteMany({});
  await Track.deleteMany({});
  await Comment.deleteMany({});
  await Like.deleteMany({});

  // Prepare local files
  const audioFiles = fs.readdirSync(AUDIO_DIR).map(f => `uploads/audio/${f}`);
  const imageFiles = fs.readdirSync(IMAGE_DIR).map(f => `uploads/images/${f}`);

  // Prepare credential log
  fs.writeFileSync(CRED_FILE, 'EMAIL,PASSWORD,ROLE\n');

  // 1. Create artists
  const artists = [];
  for (let i = 0; i < NUM_ARTISTS; i++) {
    const artistName = faker.person.fullName();
    const email = `artist${i + 1}@example.com`;
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

  // 2. Create users
  const users = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const userName = faker.person.fullName();
    const email = `user${i + 1}@example.com`;
    const password = 'password123';
    const user = await User.create({
      email,
      password,
      name: userName,
      role: 'user',
      subscription: {},
    });
    users.push(user);
    fs.appendFileSync(CRED_FILE, `${email},${password},user\n`);
  }

  // 3. Bulk create tracks, comments, likes
  let totalTracks = 0, totalComments = 0, totalLikes = 0;
  let trackBatch = [], commentBatch = [], likeBatch = [];

  for (let t = 0; t < TOTAL_TRACKS; t++) {
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const trackDoc = {
      title: faker.music.songName(),
      artist: artist._id,
      genre: faker.music.genre(),
      audioFile: audioFiles[Math.floor(Math.random() * audioFiles.length)],
      coverImage: imageFiles[Math.floor(Math.random() * imageFiles.length)],
      status: 'approved',
      uploadDate: new Date(),
      adminFeedback: '',
    };
    trackBatch.push(trackDoc);
    totalTracks++;

    // Insert batch if full or last track
    if (trackBatch.length === BATCH_SIZE || t === TOTAL_TRACKS - 1) {
      const insertedTracks = await Track.insertMany(trackBatch);
      // For each inserted track, generate comments and likes
      for (const track of insertedTracks) {
        // Likes: random subset of users
        const shuffledUsers = users.slice().sort(() => 0.5 - Math.random());
        const numLikes = faker.number.int({ min: 0, max: users.length });
        for (let l = 0; l < numLikes; l++) {
          likeBatch.push({ user: shuffledUsers[l]._id, track: track._id, createdAt: new Date() });
          totalLikes++;
        }
        // Comments: random number between 20-40
        const numComments = faker.number.int({ min: COMMENTS_PER_TRACK_MIN, max: COMMENTS_PER_TRACK_MAX });
        for (let c = 0; c < numComments; c++) {
          const commentUser = users[Math.floor(Math.random() * users.length)];
          commentBatch.push({
            track: track._id,
            user: commentUser._id,
            parent: null,
            text: faker.lorem.sentence(),
            createdAt: new Date(),
          });
          totalComments++;
        }
      }
      console.log(`Inserted ${totalTracks} tracks so far...`);
      trackBatch = [];
      // Insert comments and likes in batches
      if (commentBatch.length >= BATCH_SIZE) {
        await Comment.insertMany(commentBatch);
        commentBatch = [];
        console.log(`Inserted ${totalComments} comments so far...`);
      }
      if (likeBatch.length >= BATCH_SIZE) {
        await Like.insertMany(likeBatch);
        likeBatch = [];
        console.log(`Inserted ${totalLikes} likes so far...`);
      }
    }
  }
  // Insert any remaining comments and likes
  if (commentBatch.length > 0) {
    await Comment.insertMany(commentBatch);
    console.log(`Inserted final comments, total: ${totalComments}`);
  }
  if (likeBatch.length > 0) {
    await Like.insertMany(likeBatch);
    console.log(`Inserted final likes, total: ${totalLikes}`);
  }

  console.log(`Generated: ${artists.length} artists, ${users.length} users, ${totalTracks} tracks, ${totalComments} comments, ${totalLikes} likes.`);
  console.log(`Credentials saved to: ${CRED_FILE}`);
  mongoose.connection.close();
  process.exit();
}

main(); 