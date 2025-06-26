import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'random-string';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' }, 
        { status: 400 }
      );
    }

    console.log('Login attempt for username:', username.toLowerCase());

    // AUTO-CREATE ADMIN USER IF IT DOESN'T EXIST
    let user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user && username.toLowerCase() === 'admin') {
      console.log('Admin user not found, creating...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Create the admin user
      user = new User({
        username: 'admin',
        email: 'admin@chivent.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await user.save();
      console.log('Admin user created successfully!');
    }
    
    if (!user) {
      console.log('User not found in database');
      const userCount = await User.countDocuments();
      console.log('Total users in database:', userCount);
      
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    console.log('User found:', { 
      id: user._id, 
      username: user.username, 
      hasPassword: !!user.password 
    });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create cookie
    const cookie = serialize('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    // Return success response with cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

    response.headers.set('Set-Cookie', cookie);
    
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}