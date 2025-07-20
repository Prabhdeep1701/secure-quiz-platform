import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Check if Authorization header is present
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({
        status: 'error',
        message: 'No Authorization header found',
        headers: Object.fromEntries(req.headers.entries())
      }, { status: 401 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        status: 'error',
        message: 'Authorization header must start with "Bearer "',
        authHeader: authHeader.substring(0, 50) + '...'
      }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json({
        status: 'error',
        message: 'No token found after "Bearer "'
      }, { status: 401 });
    }

    // Try to validate the token
    try {
      const user = await getAuthUser(req);
      
      if (!user) {
        return NextResponse.json({
          status: 'error',
          message: 'Token validation failed - user not found',
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...'
        }, { status: 401 });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Token validation successful',
        user: {
          uid: user.uid,
          email: user.email,
          role: user.role
        },
        tokenLength: token.length
      });
    } catch (tokenError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Token validation failed',
        error: tokenError.message,
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth token debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 