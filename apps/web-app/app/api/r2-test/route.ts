// apps/web-app/app/api/r2-test/route.ts

import { ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { getR2Client, getBucketName } from '@/app/lib/r2-client';

export async function GET() {
  try {
    // 获取 R2 客户端和存储桶名称
    const s3Client = await getR2Client();
    const bucketName = getBucketName();
    
    console.log("Testing R2 connection with config:", {
      bucketName,
      hasClient: !!s3Client
    });
    
    // 尝试列出存储桶，这将测试连接是否正常
    const listBucketsCommand = new ListBucketsCommand({});
    const listBucketsResult = await s3Client.send(listBucketsCommand);
    
    // 尝试列出桶中的对象
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
    });
    
    const listObjectsResult = await s3Client.send(listObjectsCommand);
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
    });
    
    const listObjectsResult = await s3Client.send(listCommand);
    
    return NextResponse.json({
      success: true,
      message: 'R2 连接成功',
      bucketName,
      buckets: listBucketsResult.Buckets?.map(b => b.Name) || [],
      objects: listObjectsResult.Contents || [],
      r2Config: {
        endpoint: process.env.R2_ENDPOINT,
        accessKeyIdPrefix: process.env.R2_ACCESS_KEY_ID?.substring(0, 4) + '...',
        secretAccessKeyPrefix: process.env.R2_SECRET_ACCESS_KEY?.substring(0, 4) + '...',
        hasTokenValue: !!process.env.R2_TOKEN_VALUE,
      }
    });
    
  } catch (error) {
    console.error('R2 测试失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '连接 R2 失败',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
