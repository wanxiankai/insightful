// apps/web-app/app/api/r2-debug/route.ts

import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // 从环境变量中获取 R2 配置
    const endpoint = process.env.R2_ENDPOINT || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    const tokenValue = process.env.R2_TOKEN_VALUE || '';
    const bucketName = process.env.R2_BUCKET_NAME || '';
    
    // 提取 account ID (从 endpoint URL 中)
    const accountIdMatch = endpoint.match(/https:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;
    
    // 尝试不同的认证方法
    const results = [];
    
    // 方法1: 标准 Access Key/Secret
    if (accessKeyId && secretAccessKey) {
      try {
        console.log("方法1: 使用标准 Access Key/Secret");
        const s3Client1 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: true,
        });
        
        const result1 = await testS3Client(s3Client1, bucketName, "标准 Access Key/Secret");
        results.push(result1);
      } catch (error) {
        console.error("方法1失败:", error);
        results.push({
          method: "标准 Access Key/Secret",
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 方法2: 尝试使用 Token 作为 Secret Key
    if (accountId && tokenValue) {
      try {
        console.log("方法2: 使用 Token 作为 Secret Key");
        const s3Client2 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accountId,
            secretAccessKey: tokenValue,
          },
          forcePathStyle: true,
        });
        
        const result2 = await testS3Client(s3Client2, bucketName, "Token 作为 Secret Key");
        results.push(result2);
      } catch (error) {
        console.error("方法2失败:", error);
        results.push({
          method: "Token 作为 Secret Key",
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 方法3: 尝试不带前导负号的 Token
    if (accountId && tokenValue && tokenValue.startsWith('-')) {
      try {
        console.log("方法3: 使用不带前导负号的 Token");
        const tokenWithoutDash = tokenValue.substring(1); // 去掉前导负号
        
        const s3Client3 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accountId,
            secretAccessKey: tokenWithoutDash,
          },
          forcePathStyle: true,
        });
        
        const result3 = await testS3Client(s3Client3, bucketName, "不带前导负号的 Token");
        results.push(result3);
      } catch (error) {
        console.error("方法3失败:", error);
        results.push({
          method: "不带前导负号的 Token",
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 方法4: 尝试使用 R2 主访问密钥格式
    if (accessKeyId && tokenValue) {
      try {
        console.log("方法4: 使用 R2 主访问密钥格式");
        const s3Client4 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: tokenValue,
          },
          forcePathStyle: true,
        });
        
        const result4 = await testS3Client(s3Client4, bucketName, "R2 主访问密钥格式");
        results.push(result4);
      } catch (error) {
        console.error("方法4失败:", error);
        results.push({
          method: "R2 主访问密钥格式",
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      config: {
        endpoint,
        bucketName,
        accountId,
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey,
        hasTokenValue: !!tokenValue,
        tokenStartsWithDash: tokenValue.startsWith('-'),
      },
      results
    });
  } catch (error) {
    console.error('R2 调试测试失败:', error);
    return NextResponse.json({
      error: 'R2 调试测试失败',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// 测试 S3 客户端的辅助函数
async function testS3Client(client: S3Client, bucketName: string, methodName: string) {
  try {
    console.log(`尝试使用 ${methodName} 方法列出桶 '${bucketName}' 中的对象...`);
    
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    });
    
    const response = await client.send(listObjectsCommand);
    console.log(`${methodName} 方法成功:`, response);
    
    return {
      method: methodName,
      success: true,
      objects: response.Contents || [],
      requestId: response.$metadata?.requestId,
    };
  } catch (error: any) { // 使用 any 类型处理 AWS SDK 错误
    console.error(`${methodName} 方法失败:`, error);
    return {
      method: methodName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: error['$metadata'] || {},
    };
  }
}
