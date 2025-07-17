import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // 返回必要的会话信息（不包含敏感数据）
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      // 注意：这里我们不能直接返回 access_token，因为 NextAuth 可能不提供
      // 我们需要另一种方法来处理 Supabase 认证
    });
  } catch {
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
