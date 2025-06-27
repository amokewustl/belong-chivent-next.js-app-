
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amoke:teTpxVCHboIOB0Ss@belong-chivent-app.dhqgjmr.mongodb.net/?retryWrites=true&w=majority&appName=Belong-chivent-app';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String
});

const TicketOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'sold_out', 'disabled'],
    default: 'available'
  }
});

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    name: { type: String, required: true, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, default: 'USA', trim: true }
    },
    capacity: { type: Number, min: 1 }
  },
  dateTime: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  ticketOptions: [TicketOptionSchema],
  category: {
    type: String,
    enum: ['music', 'sports', 'business', 'arts', 'food', 'technology', 'education', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  images: [{
    url: String,
    alt: String
  }],
  tags: [{ type: String, trim: true }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);

const sampleEvents = [
  {
    title: "Chicago Summer Music Festival",
    description: "Join us for an unforgettable night of live music featuring top artists from around the world. Experience amazing performances under the stars with food trucks and craft beverages available.",
    venue: {
      name: "Grant Park Pavilion",
      address: {
        street: "337 E Randolph St",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA"
      },
      capacity: 5000
    },
    dateTime: {
      start: new Date('2025-07-15T19:00:00'),
      end: new Date('2025-07-15T23:00:00')
    },
    ticketOptions: [
      {
        name: "General Admission",
        description: "Standing room access to main venue area",
        price: 45,
        totalQuantity: 3000,
        soldQuantity: 150
      },
      {
        name: "VIP Experience",
        description: "Premium seating, complimentary drinks, and meet & greet",
        price: 125,
        totalQuantity: 500,
        soldQuantity: 75
      },
      {
        name: "Front Row Premium",
        description: "Best seats in the house with exclusive perks",
        price: 200,
        totalQuantity: 100,
        soldQuantity: 20
      }
    ],
    category: "music",
    status: "published",
    tags: ["music", "festival", "outdoor", "summer"]
  },
  {
    title: "Chicago Bulls vs Lakers",
    description: "Don't miss this exciting NBA matchup between two legendary teams. Witness basketball history in the making at the United Center.",
    venue: {
      name: "United Center",
      address: {
        street: "1901 W Madison St",
        city: "Chicago",
        state: "IL",
        zipCode: "60612",
        country: "USA"
      },
      capacity: 20000
    },
    dateTime: {
      start: new Date('2025-08-10T19:30:00'),
      end: new Date('2025-08-10T22:00:00')
    },
    ticketOptions: [
      {
        name: "Upper Level",
        description: "Great view from the upper sections",
        price: 35,
        totalQuantity: 8000,
        soldQuantity: 1200
      },
      {
        name: "Lower Level",
        description: "Closer to the action with premium seating",
        price: 85,
        totalQuantity: 6000,
        soldQuantity: 900
      },
      {
        name: "Courtside",
        description: "Ultimate basketball experience right on the court",
        price: 350,
        totalQuantity: 100,
        soldQuantity: 45
      }
    ],
    category: "sports",
    status: "published",
    tags: ["basketball", "NBA", "sports", "Bulls", "Lakers"]
  },
  {
    title: "Tech Innovation Summit 2025",
    description: "A full-day conference featuring industry leaders discussing the future of technology, AI, and innovation. Includes networking opportunities and workshops.",
    venue: {
      name: "Chicago Convention Center",
      address: {
        street: "2301 S King Dr",
        city: "Chicago",
        state: "IL",
        zipCode: "60616",
        country: "USA"
      },
      capacity: 1500
    },
    dateTime: {
      start: new Date('2025-09-22T08:00:00'),
      end: new Date('2025-09-22T18:00:00')
    },
    ticketOptions: [
      {
        name: "Standard Pass",
        description: "Access to all main sessions and networking lunch",
        price: 150,
        totalQuantity: 800,
        soldQuantity: 200
      },
      {
        name: "Premium Pass",
        description: "Includes workshops, VIP networking, and swag bag",
        price: 275,
        totalQuantity: 400,
        soldQuantity: 80
      },
      {
        name: "Executive Package",
        description: "All access plus private dinner with speakers",
        price: 500,
        totalQuantity: 50,
        soldQuantity: 15
      }
    ],
    category: "technology",
    status: "published",
    tags: ["technology", "conference", "AI", "networking", "innovation"]
  },
  {
    title: "Chicago Food & Wine Experience",
    description: "Taste the best of Chicago's culinary scene with local chefs and premium wine selections. A perfect evening for food enthusiasts.",
    venue: {
      name: "Navy Pier Grand Ballroom",
      address: {
        street: "600 E Grand Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60611",
        country: "USA"
      },
      capacity: 800
    },
    dateTime: {
      start: new Date('2025-08-05T18:00:00'),
      end: new Date('2025-08-05T22:00:00')
    },
    ticketOptions: [
      {
        name: "Tasting Pass",
        description: "Sample portions from 15+ restaurants",
        price: 65,
        totalQuantity: 500,
        soldQuantity: 125
      },
      {
        name: "Full Experience",
        description: "Unlimited tastings plus wine pairings",
        price: 95,
        totalQuantity: 250,
        soldQuantity: 60
      },
      {
        name: "Chef's Table",
        description: "Exclusive dinner with celebrity chefs",
        price: 175,
        totalQuantity: 50,
        soldQuantity: 12
      }
    ],
    category: "food",
    status: "published",
    tags: ["food", "wine", "tasting", "chefs", "culinary"]
  }
];

async function seedEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB Atlas');

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please run seed-users.js first.');
      return;
    }

    console.log(`Found organizer: ${adminUser.username}`);

    const createdEvents = [];
    
    for (const eventData of sampleEvents) {
      try {
        // Check if event already exists
        const existingEvent = await Event.findOne({ title: eventData.title });
        
        if (existingEvent) {
          console.log(`Event "${eventData.title}" already exists, skipping...`);
          continue;
        }

        const event = new Event({
          ...eventData,
          organizer: adminUser._id
        });
        
        await event.save();
        createdEvents.push(event);
        console.log(`✅ Created event: ${eventData.title}`);
        
        eventData.ticketOptions.forEach(ticket => {
          console.log(`   - ${ticket.name}: $${ticket.price} (${ticket.totalQuantity - ticket.soldQuantity}/${ticket.totalQuantity} available)`);
        });
        
      } catch (error) {
        console.error(`❌ Error creating event "${eventData.title}":`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdEvents.length} events!`);
    
    // Display summary
    console.log('\n📊 Event Summary:');
    const eventsByCategory = createdEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(eventsByCategory).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} event(s)`);
    });

    console.log('\n💰 Revenue Summary:');
    createdEvents.forEach(event => {
      const totalRevenue = event.ticketOptions.reduce((sum, ticket) => {
        return sum + (ticket.price * ticket.soldQuantity);
      }, 0);
      const maxRevenue = event.ticketOptions.reduce((sum, ticket) => {
        return sum + (ticket.price * ticket.totalQuantity);
      }, 0);
      console.log(`${event.title}: $${totalRevenue} / $${maxRevenue} potential`);
    });

  } catch (error) {
    console.error('❌ Error seeding events:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedEvents();