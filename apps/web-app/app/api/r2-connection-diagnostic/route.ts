// apps/web-app/app/api/r2-connection-diagnostic/route.ts

import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';

interface TestResult {
  method: string;
  success: boolean;
  status?: number;
  error?: string;
  errorType?: string;
  errorCode?: number | string;
  details?: string;
  objectCount?: number;
  contentType?: string | null;
  responsePreview?: string;
}

interface ConfigInfo {
  endpoint: string | undefined;
  bucketName: string | undefined;
  publicUrl: string | undefined;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  tokenValue: string | null;
}

export async function GET() {
  try {
    // 收集环境变量信息
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const tokenValue = process.env.R2_TOKEN_VALUE;
    const publicUrl = process.env.R2_PUBLIC_URL;

    const envInfo: ConfigInfo = {
      endpoint,
      bucketName,
      publicUrl,
      accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)}` : null,
      secretAccessKey: secretAccessKey ? `${secretAccessKey.substring(0, 4)}...${secretAccessKey.substring(secretAccessKey.length - 4)}` : null,
      tokenValue: tokenValue ? `${tokenValue.substring(0, 4)}...${tokenValue.substring(tokenValue.length - 4)}` : null,
    };

    // 从 endpoint 中提取 accountId
    const accountIdMatch = endpoint?.match(/https:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;

    console.log("Cloudflare R2 诊断开始");
    console.log("环境变量信息:", envInfo);
    console.log("从 endpoint 提取的 accountId:", accountId);

    const results: TestResult[] = [];

    // 测试1: 使用 Access Key + Secret
    if (accessKeyId && secretAccessKey && endpoint && bucketName) {
      try {
        console.log("测试1: 使用 Access Key + Secret 尝试连接");
        const s3Client1 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        // 尝试进行存储桶验证
        const headBucketCommand = new HeadBucketCommand({
          Bucket: bucketName,
        });

        const headResult = await s3Client1.send(headBucketCommand);
        results.push({
          method: "AccessKey/Secret + HeadBucket",
          success: true,
          status: headResult.$metadata.httpStatusCode,
          details: "存储桶验证成功"
        });
      } catch (error: unknown) {
        console.error("测试1失败:", error);
        const err = error as any; // 临时类型断言以访问错误属性
        results.push({
          method: "AccessKey/Secret + HeadBucket",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: err?.constructor?.name,
          errorCode: err?.Code || err?.$metadata?.httpStatusCode,
        });
      }

      try {
        console.log("测试1.1: 使用 Access Key + Secret 列出对象");
        const s3Client1 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 5,
        });

        const listResult = await s3Client1.send(listObjectsCommand);
        results.push({
          method: "AccessKey/Secret + ListObjects",
          success: true,
          status: listResult.$metadata.httpStatusCode,
          objectCount: listResult.Contents?.length || 0,
          details: "对象列表获取成功"
        });
      } catch (error: unknown) {
        console.error("测试1.1失败:", error);
        const err = error as Record<string, any>; // 临时类型断言
        results.push({
          method: "AccessKey/Secret + ListObjects",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: err?.constructor?.name,
          errorCode: err?.Code || err?.$metadata?.httpStatusCode,
        });
      }
    }

    // 测试2: 使用 Token (accountId + tokenValue)
    if (tokenValue && accountId && endpoint && bucketName) {
      try {
        console.log("测试2: 使用 R2 Token 尝试连接");
        const s3Client2 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accountId,
            secretAccessKey: tokenValue,
          },
          forcePathStyle: true,
        });

        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 5,
        });

        const listResult = await s3Client2.send(listObjectsCommand);
        results.push({
          method: "R2 Token",
          success: true,
          status: listResult.$metadata.httpStatusCode,
          objectCount: listResult.Contents?.length || 0,
          details: "使用 Token 获取对象列表成功"
        });
      } catch (error: any) {
        console.error("测试2失败:", error);
        results.push({
          method: "R2 Token",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: error.constructor?.name,
          errorCode: error.Code || error.$metadata?.httpStatusCode,
        });
      }
    }

    // 测试3: 直接通过 HTTP 尝试访问存储桶（如果有公共URL）
    if (publicUrl) {
      try {
        console.log("测试3: 直接通过 HTTP 尝试访问存储桶");
        const testUrl = `${publicUrl}?list-type=2&max-keys=1`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          },
        });

        const text = await response.text();
        results.push({
          method: "HTTP Direct Access",
          success: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type'),
          responsePreview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        });
      } catch (error: any) {
        console.error("测试3失败:", error);
        results.push({
          method: "HTTP Direct Access",
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 生成所有密钥的校验和，以便检查是否有复制错误
    const checksums: Record<string, string> = {};
    if (accessKeyId) {
      checksums.accessKeyId = createHash('md5').update(accessKeyId).digest('hex');
    }
    if (secretAccessKey) {
      checksums.secretAccessKey = createHash('md5').update(secretAccessKey).digest('hex');
    }
    if (tokenValue) {
      checksums.tokenValue = createHash('md5').update(tokenValue).digest('hex');
    }

    // 构建最终响应
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      cloudflareR2Config: {
        ...envInfo,
        accountId,
      },
      checksums,
      testResults: results,
      recommendations: generateRecommendations(results, envInfo),
    });
  } catch (error) {
    console.error('R2 诊断失败:', error);
    return NextResponse.json({
      error: 'R2 诊断执行过程中发生错误',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// 根据测试结果生成建议
function generateRecommendations(results: TestResult[], config: ConfigInfo): string[] {
  const recommendations: string[] = [];
  
  // 检查是否所有测试都失败了
  const allFailed = results.every((r: TestResult) => !r.success);
  
  if (allFailed) {
    recommendations.push("所有连接测试均失败，请检查以下几点：");
    
    // 检查 endpoint 格式
    if (!config.endpoint || !config.endpoint.startsWith('https://')) {
      recommendations.push("- R2_ENDPOINT 格式可能不正确，应为 https://{accountid}.r2.cloudflarestorage.com");
    }
    
    // 检查凭证
    if (!config.accessKeyId || !config.secretAccessKey) {
      recommendations.push("- 缺少 R2 Access Key 或 Secret，请检查 Cloudflare R2 控制台中的 API 令牌");
    }
    
    // 检查存储桶名称
    if (!config.bucketName) {
      recommendations.push("- 未设置存储桶名称 (R2_BUCKET_NAME)");
    }
    
    // 401错误可能是凭证问题
    const has401 = results.some((r: TestResult) => r.status === 401 || r.errorCode === 401);
    if (has401) {
      recommendations.push("- 出现 401 Unauthorized 错误，表明凭证无效。请检查：");
      recommendations.push("  1. Access Key 和 Secret Key 是否从 Cloudflare R2 控制台正确复制");
      recommendations.push("  2. R2 Token 是否具有足够的权限（至少需要读取权限）");
      recommendations.push("  3. 确认凭证没有过期或被撤销");
    }
    
    // 403错误可能是权限问题
    const has403 = results.some((r: TestResult) => r.status === 403 || r.errorCode === 403);
    if (has403) {
      recommendations.push("- 出现 403 Forbidden 错误，表明凭证有效但权限不足。请检查：");
      recommendations.push("  1. 确保 R2 Token 或 API 密钥有权访问指定的存储桶");
      recommendations.push("  2. 检查存储桶策略是否限制了访问");
    }
    
    // 404错误可能是存储桶不存在
    const has404 = results.some((r: TestResult) => r.status === 404 || r.errorCode === 404);
    if (has404) {
      recommendations.push("- 出现 404 Not Found 错误，可能存储桶不存在或名称错误");
      recommendations.push("  请在 Cloudflare R2 控制台中确认存储桶名称的拼写是否正确");
    }
    
    // 通用建议
    recommendations.push("- 请考虑重新生成 R2 API 令牌，并确保为其分配正确的权限");
    recommendations.push("- 在 Cloudflare R2 控制台中确认您的账户状态和计费情况");
  } else {
    // 部分测试成功
    const successMethods = results.filter((r: TestResult) => r.success).map((r: TestResult) => r.method);
    recommendations.push(`以下方法连接成功: ${successMethods.join(', ')}`);
    
    const failedTests = results.filter((r: TestResult) => !r.success);
    if (failedTests.length > 0) {
      recommendations.push("部分测试失败，请根据具体错误信息排查");
    }
  }
  
  return recommendations;
}
