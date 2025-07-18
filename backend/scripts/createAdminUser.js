const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

dotenv.config();

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
      process.exit(1);
    }

    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log(`Updated user ${adminEmail} role to admin.`);
      } else {
        console.log(`Admin user with email ${adminEmail} already exists.`);
      }
    } else {
      // Do NOT hash the password here; let the User model's pre-save hook handle it
      adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // plain text, will be hashed by pre-save
        role: 'admin',
      });
      await adminUser.save();
      console.log(`Created new admin user with email ${adminEmail}.`);
      console.log(adminPassword)
    }

    console.log('Admin user setup complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error setting up admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser(); 