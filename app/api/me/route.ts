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
      console.log(request.cookies);
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }


    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Find user in MongoDB
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Return user info 
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role, 
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        profile: user.profile,
        preferences: user.preferences,
        eventHistory: user.eventHistory,
        savedEvents: user.savedEvents,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
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

    const updateData = await request.json();
    // required fields
    if (updateData.firstName && updateData.firstName.trim().length < 1) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    if (updateData.lastName && updateData.lastName.trim().length < 1) {
      return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    }

    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
      }
    }

    if (updateData.phone && updateData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(updateData.phone)) {
        return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
      }
    }

    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        return NextResponse.json({ error: 'Date of birth cannot be in the future' }, { status: 400 });
      }
    }

    const updateObject: any = {};

    if (updateData.firstName) updateObject.firstName = updateData.firstName.trim();
    if (updateData.lastName) updateObject.lastName = updateData.lastName.trim();
    if (updateData.phone !== undefined) updateObject.phone = updateData.phone?.trim() || null;
    if (updateData.dateOfBirth !== undefined) {
      updateObject.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
    }

    // address 
    if (updateData.address) {
      updateObject.address = {
        street: updateData.address.street?.trim() || '',
        city: updateData.address.city?.trim() || '',
        state: updateData.address.state?.trim() || '',
        zipCode: updateData.address.zipCode?.trim() || '',
        country: updateData.address.country?.trim() || 'USA'
      };
    }

    // Profile
    if (updateData.profile) {
      updateObject.profile = {
        bio: updateData.profile.bio?.trim() || '',
        interests: Array.isArray(updateData.profile.interests) 
          ? updateData.profile.interests.filter((interest: string) => interest.trim().length > 0)
          : user.profile?.interests || [],
        location: updateData.profile.location?.trim() || ''
      };
    }

    // preferences
    if (updateData.preferences) {
      updateObject.preferences = {
        emailNotifications: updateData.preferences.emailNotifications ?? user.preferences?.emailNotifications ?? true,
        smsNotifications: updateData.preferences.smsNotifications ?? user.preferences?.smsNotifications ?? false,
        eventReminders: updateData.preferences.eventReminders ?? user.preferences?.eventReminders ?? true,
        newsletter: updateData.preferences.newsletter ?? user.preferences?.newsletter ?? true
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        ...updateObject,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        address: updatedUser.address,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences,
        eventHistory: updatedUser.eventHistory,
        savedEvents: updatedUser.savedEvents,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        emailVerified: updatedUser.emailVerified,
        status: updatedUser.status
      }
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}