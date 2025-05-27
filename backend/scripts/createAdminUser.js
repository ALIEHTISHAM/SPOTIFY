const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

dotenv.config();

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.TEMP_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.TEMP_ADMIN_PASSWORD || 'adminpassword';
    
    // Note: We are not setting the password here, as the temporary login uses hardcoded password check.
    // We just need to ensure a user with the correct email and role exists.
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log(`User with email ${adminEmail} already exists.`);
      // Ensure the role is admin if it's not already
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log(`Updated user ${adminEmail} role to admin.`);
      }
    } else {
      // If user doesn't exist, create a new one.
      // For simplicity, we are setting a basic password. The temporary login still checks hardcoded password.
      // In a real scenario, you would hash this password.
      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: 'password123', // A placeholder password, not used by temporary login's password check
        role: 'admin',
      });
      await adminUser.save();
      console.log(`Created new admin user with email ${adminEmail}.`);
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