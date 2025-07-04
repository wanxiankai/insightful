// apps/web-app/app/api/r2-buckets-test/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 从环境变量获取 R2 配置
    const accountId = process.env.R2_ENDPOINT?.match(/https:\/\/([^.]+)/)?.[1] || '';
    const accountToken = process.env.R2_TOKEN_VALUE || '';
    
    // 检查是否有必要的配置
    if (!accountId || !accountToken) {
      return NextResponse.json({
        error: '缺少 R2 配置',
        missingConfig: {
          accountId: !accountId,
          accountToken: !accountToken,
        }
      }, { status: 500 });
    }
    
    console.log("尝试使用 Cloudflare API 列出 R2 存储桶");
    console.log("- Account ID:", accountId);
    console.log("- Token (开头):", accountToken.substring(0, 5) + '...');
    
    // 使用 Cloudflare API 列出 R2 存储桶
    // https://developers.cloudflare.com/api/operations/r2-buckets-list-buckets
    const bucketListUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
    
    const response = await fetch(bucketListUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accountToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Cloudflare API 请求失败:", data);
      return NextResponse.json({
        success: false,
        statusCode: response.status,
        error: data,
      });
    }
    
    console.log("Cloudflare API 返回的存储桶列表:", data);
    
    return NextResponse.json({
      success: true,
      buckets: data.result,
      apiResponse: data,
    });
    
  } catch (error) {
    console.error('R2 存储桶测试失败:', error);
    return NextResponse.json({
      error: 'R2 存储桶测试失败',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
