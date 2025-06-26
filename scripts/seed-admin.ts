import bcrypt from 'bcrypt';
import connectDB from '../lib/mongodb';
import User from '../models/user';

async function seedAdmin() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with hashed password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@chivent.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@chivent.com');

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    process.exit();
  }
}

seedAdmin();