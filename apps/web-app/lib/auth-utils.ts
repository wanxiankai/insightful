// 公共身份验证辅助函数
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function validateUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  
  return {
    user: session.user,
    error: null
  };
}

export async function requireAuth() {
  const { user, error } = await validateUser();
  
  if (error) {
    throw new Error('Authentication required');
  }
  
  return user!;
}
