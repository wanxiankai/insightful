// apps/web-app/app/api/proxy/r2-upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// 设置更大的请求体大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // 最大支持50MB的文件
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 从请求中获取原始请求数据
    const { url, fileType, file } = await request.json();
    
    if (!url || !file) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    console.log("代理上传到:", url);
    
    // 将Base64编码的文件转换为二进制
    const binaryData = Buffer.from(file.split(',')[1], 'base64');
    
    // 通过服务器端请求转发到R2
    const r2Response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType || 'application/octet-stream',
      },
      body: binaryData,
    });
    
    if (!r2Response.ok) {
      const errorText = await r2Response.text();
      console.error('R2上传失败:', r2Response.status, errorText);
      return NextResponse.json(
        { error: `上传失败: ${r2Response.status} ${errorText}` },
        { status: r2Response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '文件上传成功',
    });
    
  } catch (error) {
    console.error('代理上传失败:', error);
    return NextResponse.json(
      { error: '代理上传失败' },
      { status: 500 }
    );
  }
}
