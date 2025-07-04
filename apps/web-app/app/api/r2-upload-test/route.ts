// apps/web-app/app/api/r2-upload-test/route.ts

import { NextResponse } from 'next/server';
import { getR2Client, getBucketName } from '@/app/lib/r2-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    console.log('Starting R2 upload test...');
    
    // 获取 R2 客户端
    const s3Client = await getR2Client();
    const bucketName = getBucketName();
    
    console.log('R2 client initialized with bucket:', bucketName);
    
    // 创建测试数据
    const testData = 'This is a test file for R2 upload. Time: ' + new Date().toISOString();
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    
    // 上传测试文件
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testData,
      ContentType: 'text/plain',
    });
    
    console.log('Sending PutObjectCommand to R2...');
    const response = await s3Client.send(putCommand);
    console.log('R2 upload successful:', response);
    
    return NextResponse.json({
      success: true,
      message: 'R2 test upload successful',
      fileKey: testKey,
      etag: response.ETag,
    });
  } catch (error) {
    console.error('R2 upload test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'R2 upload test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
