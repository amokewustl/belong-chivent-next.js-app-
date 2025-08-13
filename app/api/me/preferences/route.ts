import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Mongo from '@/lib/mongodb';
import User from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'random-string';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function GET(request: NextRequest) {
  try {
    await Mongo.getInstance();
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await User.findById(decoded.userId).select('preferences');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      preferences: user.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        eventReminders: true,
        newsletter: true
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await Mongo.getInstance();
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
    }

    const validPreferences = {
      emailNotifications: Boolean(preferences.emailNotifications),
      smsNotifications: Boolean(preferences.smsNotifications),
      eventReminders: Boolean(preferences.eventReminders),
      newsletter: Boolean(preferences.newsletter)
    };

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        preferences: validPreferences,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });

  } catch (error: any) {
    console.error('Update preferences error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await Mongo.getInstance();
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const defaultPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      newsletter: true
    };

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        preferences: defaultPreferences,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Preferences reset to defaults',
      preferences: updatedUser.preferences
    });

  } catch (error: any) {
    console.error('Reset preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}