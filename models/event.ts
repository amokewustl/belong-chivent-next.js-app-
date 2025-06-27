import mongoose from 'mongoose';

interface ITicketOption {
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  status: 'available' | 'sold_out' | 'disabled';
  availableQuantity: number;
}

interface IEvent extends mongoose.Document {
  title: string;
  description: string;
  organizer: mongoose.Types.ObjectId;
  venue: {
    name: string;
    address: {
      street?: string;
      city: string;
      state: string;
      zipCode?: string;
      country: string;
    };
    capacity?: number;
  };
  dateTime: {
    start: Date;
    end: Date;
  };
  ticketOptions: ITicketOption[];
  category: 'music' | 'sports' | 'business' | 'arts' | 'food' | 'technology' | 'education' | 'other';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  images: Array<{
    url?: string;
    alt?: string;
  }>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  totalRevenuePotential: number;
  currentRevenue: number;
  hasAvailableTickets(): boolean;
  getCheapestTicketPrice(): number | null;
  getMostExpensiveTicketPrice(): number | null;
}

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

TicketOptionSchema.virtual('availableQuantity').get(function(this: ITicketOption) {
  return this.totalQuantity - this.soldQuantity;
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

EventSchema.pre('save', function(this: IEvent, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.updatedAt = new Date();
  
  // check that the end date is after start date
  if (this.dateTime?.end && this.dateTime?.start && this.dateTime.end <= this.dateTime.start) {
    return next(new Error('End date must be after start date'));
  }
  
  this.ticketOptions.forEach((ticket: ITicketOption) => {
    if (ticket.soldQuantity >= ticket.totalQuantity) {
      ticket.status = 'sold_out';
    } else if (ticket.status === 'sold_out' && ticket.soldQuantity < ticket.totalQuantity) {
      ticket.status = 'available';
    }
  });
  
  next();
});

EventSchema.pre('findOneAndUpdate', function(next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.set({ updatedAt: new Date() });
  next();
});

EventSchema.virtual('totalRevenuePotential').get(function(this: IEvent) {
  return this.ticketOptions.reduce((total: number, ticket: ITicketOption) => {
    return total + (ticket.price * ticket.totalQuantity);
  }, 0);
});

EventSchema.virtual('currentRevenue').get(function(this: IEvent) {
  return this.ticketOptions.reduce((total: number, ticket: ITicketOption) => {
    return total + (ticket.price * ticket.soldQuantity);
  }, 0);
});

// check if event has available tickets
EventSchema.methods.hasAvailableTickets = function(this: IEvent) {
  return this.ticketOptions.some((ticket: ITicketOption) => 
    ticket.status === 'available' && ticket.availableQuantity > 0
  );
};

// cheapest ticket price
EventSchema.methods.getCheapestTicketPrice = function(this: IEvent) {
  const availableTickets = this.ticketOptions.filter((ticket: ITicketOption) => 
    ticket.status === 'available' && ticket.availableQuantity > 0
  );
  
  if (availableTickets.length === 0) return null;
  
  return Math.min(...availableTickets.map((ticket: ITicketOption) => ticket.price));
};

//  most expensive ticket price
EventSchema.methods.getMostExpensiveTicketPrice = function(this: IEvent) {
  const availableTickets = this.ticketOptions.filter((ticket: ITicketOption) => 
    ticket.status === 'available' && ticket.availableQuantity > 0
  );
  
  if (availableTickets.length === 0) return null;
  
  return Math.max(...availableTickets.map((ticket: ITicketOption) => ticket.price));
};

const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
export default Event;