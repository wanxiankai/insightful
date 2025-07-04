// apps/web-app/app/api/r2-simple-test/route.ts

import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // 直接从环境变量初始化 S3 客户端
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    
    console.log("R2 simple test config:", {
      hasEndpoint: !!endpoint,
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
    });
    
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({
        success: false,
        error: "Missing R2 configuration",
        config: {
          hasEndpoint: !!endpoint,
          hasAccessKey: !!accessKeyId,
          hasSecretKey: !!secretAccessKey,
        }
      }, { status: 400 });
    }
    
    // 创建 S3 客户端
    const s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    // 尝试列出存储桶
    const listBucketsCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listBucketsCommand);
    
    return NextResponse.json({
      success: true,
      message: "R2 connection successful",
      buckets: response.Buckets?.map(b => b.Name) || [],
      r2Config: {
        endpoint,
        accessKeyIdPrefix: accessKeyId.substring(0, 4) + '...',
        secretAccessKeyPrefix: secretAccessKey.substring(0, 4) + '...',
      }
    });
  } catch (error) {
    console.error("R2 simple test failed:", error);
    return NextResponse.json({
      success: false,
      error: "R2 connection failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
