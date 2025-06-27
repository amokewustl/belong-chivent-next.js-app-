import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
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

    // Validation
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

    // Create new user 
    const userData: any = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      is_admin: role === 'admin' 
    };

    //  optional fields 
    if (phone) userData.phone = phone.trim();
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
    if (address) userData.address = address;
    if (preferences) userData.preferences = { ...userData.preferences, ...preferences };
    if (profile) userData.profile = profile;

    const newUser = new User(userData);
    await newUser.save();

    // Return user data
    return NextResponse.json({
      message: 'User registered successfully',
      user: newUser.getSafeData()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    
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