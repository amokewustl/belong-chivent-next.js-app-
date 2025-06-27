
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amoke:teTpxVCHboIOB0Ss@belong-chivent-app.dhqgjmr.mongodb.net/?retryWrites=true&w=majority&appName=Belong-chivent-app';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'USA' }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    eventReminders: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true }
  },
  profile: {
    bio: { type: String, maxlength: 500 },
    avatar: { type: String },
    interests: [{ type: String }],
    location: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.is_admin = this.role === 'admin';
  next();
});

const User = mongoose.model('User', UserSchema);

const sampleUsers = [
  // Admin users
  {
    username: 'admin',
    email: 'admin@chivent.com',
    password: 'admin123',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+1-555-0001',
    role: 'admin',
    address: {
      street: '123 Admin St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    profile: {
      bio: 'Main administrator of the Chivent platform',
      interests: ['Event Management', 'Technology', 'Community Building'],
      location: 'Chicago, IL'
    },
    emailVerified: true
  },
  {
    username: 'sarah_admin',
    email: 'sarah.admin@chivent.com',
    password: 'sarah123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1-555-0002',
    dateOfBirth: new Date('1988-05-15'),
    role: 'admin',
    address: {
      street: '456 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60602',
      country: 'USA'
    },
    profile: {
      bio: 'Event coordinator and community manager with 8+ years experience',
      interests: ['Events', 'Music', 'Photography', 'Travel'],
      location: 'Chicago, IL'
    },
    emailVerified: true
  },
  {
    username: 'mike_mod',
    email: 'mike.mod@chivent.com',
    password: 'mike123',
    firstName: 'Michael',
    lastName: 'Chen',
    phone: '+1-555-0003',
    dateOfBirth: new Date('1992-11-22'),
    role: 'admin',
    address: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60603',
      country: 'USA'
    },
    profile: {
      bio: 'Content moderator and customer support specialist',
      interests: ['Gaming', 'Technology', 'Sports', 'Food'],
      location: 'Chicago, IL'
    },
    emailVerified: true
  },
  
  // Regular users
  {
    username: 'john_doe',
    email: 'john.doe@example.com',
    password: 'john123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0101',
    dateOfBirth: new Date('1990-03-10'),
    role: 'user',
    address: {
      street: '321 Elm St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60604',
      country: 'USA'
    },
    profile: {
      bio: 'Love attending live music events and art exhibitions',
      interests: ['Music', 'Art', 'Culture', 'Food'],
      location: 'Chicago, IL'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      eventReminders: true,
      newsletter: true
    },
    emailVerified: true
  },
  {
    username: 'emma_smith',
    email: 'emma.smith@example.com',
    password: 'emma123',
    firstName: 'Emma',
    lastName: 'Smith',
    phone: '+1-555-0102',
    dateOfBirth: new Date('1995-07-25'),
    role: 'user',
    address: {
      street: '654 Maple Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60605',
      country: 'USA'
    },
    profile: {
      bio: 'Event enthusiast and social butterfly who loves meeting new people',
      interests: ['Networking', 'Business', 'Fitness', 'Travel'],
      location: 'Chicago, IL'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      newsletter: false
    },
    emailVerified: true
  },
  {
    username: 'alex_wilson',
    email: 'alex.wilson@example.com',
    password: 'alex123',
    firstName: 'Alex',
    lastName: 'Wilson',
    phone: '+1-555-0103',
    dateOfBirth: new Date('1987-12-03'),
    role: 'user',
    address: {
      street: '987 Cedar Blvd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60606',
      country: 'USA'
    },
    profile: {
      bio: 'Tech professional who enjoys conferences and workshops',
      interests: ['Technology', 'Innovation', 'Learning', 'Coding'],
      location: 'Chicago, IL'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      eventReminders: true,
      newsletter: true
    },
    emailVerified: false
  },
  {
    username: 'lisa_brown',
    email: 'lisa.brown@example.com',
    password: 'lisa123',
    firstName: 'Lisa',
    lastName: 'Brown',
    phone: '+1-555-0104',
    dateOfBirth: new Date('1993-09-18'),
    role: 'user',
    address: {
      street: '147 Birch Lane',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60607',
      country: 'USA'
    },
    profile: {
      bio: 'Artist and creative professional passionate about cultural events',
      interests: ['Art', 'Design', 'Culture', 'Museums'],
      location: 'Chicago, IL'
    },
    preferences: {
      emailNotifications: false,
      smsNotifications: false,
      eventReminders: true,
      newsletter: true
    },
    emailVerified: true
  },
  {
    username: 'david_garcia',
    email: 'david.garcia@example.com',
    password: 'david123',
    firstName: 'David',
    lastName: 'Garcia',
    phone: '+1-555-0105',
    dateOfBirth: new Date('1991-01-14'),
    role: 'user',
    address: {
      street: '258 Spruce Way',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60608',
      country: 'USA'
    },
    profile: {
      bio: 'Sports enthusiast who loves attending games and fitness events',
      interests: ['Sports', 'Fitness', 'Health', 'Outdoor Activities'],
      location: 'Chicago, IL'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: true,
      eventReminders: false,
      newsletter: false
    },
    emailVerified: true
  }
];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Create users
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        });
        
        if (existingUser) {
          console.log(`User ${userData.username} already exists, skipping...`);
          continue;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        
        // Create user
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdUsers.length} users!`);
    
    // summary
    const adminCount = createdUsers.filter(u => u.role === 'admin').length;
    const userCount = createdUsers.filter(u => u.role === 'user').length;
    
    console.log('\n📊 User Summary:');
    console.log(`- Admins: ${adminCount}`);

    console.log(`- Regular Users: ${userCount}`);
    console.log(`- Total: ${createdUsers.length}`);
    
    console.log('\n🔑 Login Credentials:');
    sampleUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.username} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Connection Tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify your MongoDB Atlas credentials');
      console.log('3. Ensure your IP address is whitelisted in MongoDB Atlas');
      console.log('4. Check if your .env file contains the correct MONGODB_URI');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedUsers();