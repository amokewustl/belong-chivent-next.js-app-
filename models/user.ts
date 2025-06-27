import mongoose from 'mongoose';

interface IEventHistory {
  eventId: mongoose.Types.ObjectId;
  eventTitle: string;
  ticketType: string;
  ticketPrice: number;
  purchaseDate: Date;
  attendedDate?: Date;
  rating?: number;
  review?: string;
}

interface ISavedEvent {
  eventId: mongoose.Types.ObjectId;
  savedAt: Date;
}

interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  role: 'user' | 'admin';
  is_admin: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    eventReminders: boolean;
    newsletter: boolean;
  };
  profile: {
    bio?: string;
    avatar?: string;
    interests?: string[];
    location?: string;
  };
  eventHistory: IEventHistory[];
  savedEvents: ISavedEvent[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  loginCount: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  fullName: string;
  age: number | null;
  isAdmin(): boolean;
  addEventToHistory(eventId: mongoose.Types.ObjectId, eventTitle: string, ticketType: string, ticketPrice: number): Promise<IUser>;
  saveEvent(eventId: mongoose.Types.ObjectId): Promise<IUser>;
  unsaveEvent(eventId: mongoose.Types.ObjectId): Promise<IUser>;
  getTotalEventSpending(): number;
  getSafeData(): any;
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
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
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
  eventHistory: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    eventTitle: { type: String },
    ticketType: { type: String }, // ticket option they purchased
    ticketPrice: { type: Number },
    purchaseDate: { type: Date, default: Date.now },
    attendedDate: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 }
  }],
  savedEvents: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    savedAt: { type: Date, default: Date.now }
  }],
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
  },
  emailVerificationToken: {
    type: String
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
});

UserSchema.pre('save', function(this: IUser, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.updatedAt = new Date();
  
  // Set is_admin based on role
  this.is_admin = this.role === 'admin';
  
  next();
});

UserSchema.pre('findOneAndUpdate', function(next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.set({ updatedAt: new Date() });
  next();
});

UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('age').get(function(this: IUser) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// check if user is admin
UserSchema.methods.isAdmin = function(this: IUser) {
  return this.is_admin === true || this.role === 'admin';
};

// add event to history 
UserSchema.methods.addEventToHistory = function(
  this: IUser, 
  eventId: mongoose.Types.ObjectId, 
  eventTitle: string, 
  ticketType: string, 
  ticketPrice: number
) {
  this.eventHistory.push({
    eventId,
    eventTitle,
    ticketType,
    ticketPrice,
    purchaseDate: new Date()
  } as IEventHistory);
  return this.save();
};

// save an event to wishlist
UserSchema.methods.saveEvent = function(this: IUser, eventId: mongoose.Types.ObjectId) {
  // Check if already saved
  const alreadySaved = this.savedEvents.some((saved: ISavedEvent) => 
    saved.eventId.toString() === eventId.toString()
  );
  
  if (!alreadySaved) {
    this.savedEvents.push({ eventId, savedAt: new Date() } as ISavedEvent);
    return this.save();
  }
  return Promise.resolve(this);
};

// remove event from wishlist
UserSchema.methods.unsaveEvent = function(this: IUser, eventId: mongoose.Types.ObjectId) {
  this.savedEvents = this.savedEvents.filter((saved: ISavedEvent) => 
    saved.eventId.toString() !== eventId.toString()
  );
  return this.save();
};

UserSchema.methods.getTotalEventSpending = function(this: IUser) {
  return this.eventHistory.reduce((total: number, event: IEventHistory) => {
    return total + (event.ticketPrice || 0);
  }, 0);
};

UserSchema.methods.getSafeData = function(this: IUser) {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    phone: this.phone,
    role: this.role,
    is_admin: this.is_admin,
    status: this.status,
    profile: this.profile,
    preferences: this.preferences,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    emailVerified: this.emailVerified,
    eventHistory: this.eventHistory,
    savedEvents: this.savedEvents
  };
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;