// scripts/createAdmin.js
// Run this script to create the admin user in your database
// Usage: node scripts/createAdmin.js

require('dotenv').config(); // Load environment variables
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chivent';

// User schema (adjust path as needed)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Update the existing user
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        email: 'admin@chivent.com',
        role: 'admin'
      });
      
      console.log('Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Create the admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@chivent.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully!');
    }
    
    console.log('Demo credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();