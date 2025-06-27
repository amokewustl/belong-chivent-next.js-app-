// Get all admin users
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'random-string';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Find current user
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser || !currentUser.isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Get stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStats = {
      total,
      admin: stats.find(s => s._id === 'admin')?.count || 0,
      moderator: stats.find(s => s._id === 'moderator')?.count || 0,
      user: stats.find(s => s._id === 'user')?.count || 0,
      active: await User.countDocuments({ status: 'active' }),
      inactive: await User.countDocuments({ status: 'inactive' })
    };

    return NextResponse.json({
      users: users.map(user => user.getSafeData()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: userStats
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify admin access
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = await User.findById(decoded.userId);
    
    if (!currentUser || !currentUser.isAdmin()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      dateOfBirth,
      role = 'user',
      address,
      preferences,
      profile
    } = await request.json();

    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Username, email, password, first name, and last name are required' }, 
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' }, 
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' }, 
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' }, 
        { status: 400 }
      );
    }

    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' }, 
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' }, 
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    
    const userData: any = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      is_admin: role === 'admin' || role === 'moderator'
    };

    // optional fields 
    if (phone) userData.phone = phone.trim();
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (address) userData.address = address;
    if (preferences) userData.preferences = { ...userData.preferences, ...preferences };
    if (profile) userData.profile = profile;

    const newUser = new User(userData);
    await newUser.save();
    
    return NextResponse.json({
      message: 'User created successfully',
      user: newUser.getSafeData()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Username or email already exists' }, 
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}