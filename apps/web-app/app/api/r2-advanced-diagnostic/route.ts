// apps/web-app/app/api/r2-advanced-diagnostic/route.ts

import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListBucketsCommand, 
  HeadBucketCommand, 
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomBytes } from 'crypto';

interface TestResult {
  method: string;
  authType: string;
  operation: string;
  success: boolean;
  status?: number;
  error?: string;
  errorType?: string;
  errorCode?: string | number;
  details?: string;
  data?: Record<string, unknown>;
  duration?: number;
}

interface ConfigInfo {
  endpoint: string | undefined;
  bucketName: string | undefined;
  publicUrl: string | undefined;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  tokenValue: string | null;
  accountId: string | null;
}

// Type for AWS SDK errors
interface AWSError extends Error {
  $metadata?: { httpStatusCode?: number };
  Code?: string;
  name: string;
}

// Helper function to process AWS errors
function processAWSError(error: unknown): { message: string, name: string, code?: string | number } {
  if (error instanceof Error) {
    const awsError = error as AWSError;
    return {
      message: awsError.message,
      name: awsError.name,
      code: awsError.$metadata?.httpStatusCode || awsError.Code
    };
  }
  return {
    message: String(error),
    name: 'UnknownError'
  };
}

// Record start time and return a function to calculate duration
function timeExecution() {
  const start = Date.now();
  return () => Date.now() - start;
}

// Helper function to format credentials for logging (showing only partial values)
function formatCredential(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return '***' + value.substring(value.length - 2);
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}

export async function GET() {
  try {
    // Get environment variables
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const tokenValue = process.env.R2_TOKEN_VALUE;
    const publicUrl = process.env.R2_PUBLIC_URL;

    // Extract accountId from endpoint URL
    const accountIdMatch = endpoint?.match(/https:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;

    // Store config info for diagnostics
    const envInfo: ConfigInfo = {
      endpoint,
      bucketName,
      publicUrl,
      accessKeyId: formatCredential(accessKeyId),
      secretAccessKey: formatCredential(secretAccessKey),
      tokenValue: formatCredential(tokenValue),
      accountId: formatCredential(accountId),
    };

    console.log("Starting Cloudflare R2 Advanced Diagnostic");
    console.log("Environment configuration:", JSON.stringify(envInfo, null, 2));

    const results: TestResult[] = [];
    const startTime = Date.now();

    // Generate a test file key with timestamp to avoid caching issues
    const testFileKey = `diagnostic-test-${randomBytes(4).toString('hex')}-${Date.now()}.txt`;
    const testContent = 'This is a test file for R2 diagnostics';

    // 1. TEST ACCESS KEY + SECRET AUTH
    if (accessKeyId && secretAccessKey && endpoint) {
      // Create a client with Access Key + Secret
      const s3ClientWithKey = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });

      // 1.1 List Buckets (requires global permissions)
      try {
        const timer = timeExecution();
        const listBucketsCmd = new ListBucketsCommand({});
        const listBucketsResult = await s3ClientWithKey.send(listBucketsCmd);
        
        results.push({
          method: "AWS SDK",
          authType: "AccessKey/Secret",
          operation: "ListBuckets",
          success: true,
          status: listBucketsResult.$metadata.httpStatusCode,
          details: `Found ${listBucketsResult.Buckets?.length || 0} buckets`,
          data: {
            buckets: listBucketsResult.Buckets?.map(b => b.Name) || []
          },
          duration: timer()
        });
      } catch (error: unknown) {
        const errorDetails = processAWSError(error);
        results.push({
          method: "AWS SDK",
          authType: "AccessKey/Secret",
          operation: "ListBuckets",
          success: false,
          error: errorDetails.message,
          errorType: errorDetails.name,
          errorCode: errorDetails.code,
          duration: -1
        });
      }

      // 1.2 Head Bucket (check if bucket exists and is accessible)
      if (bucketName) {
        try {
          const timer = timeExecution();
          const headBucketCmd = new HeadBucketCommand({
            Bucket: bucketName
          });
          const headBucketResult = await s3ClientWithKey.send(headBucketCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "HeadBucket",
            success: true,
            status: headBucketResult.$metadata.httpStatusCode,
            details: `Bucket "${bucketName}" exists and is accessible`,
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "HeadBucket",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 1.3 List Objects
        try {
          const timer = timeExecution();
          const listObjectsCmd = new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 5
          });
          const listObjectsResult = await s3ClientWithKey.send(listObjectsCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "ListObjects",
            success: true,
            status: listObjectsResult.$metadata.httpStatusCode,
            details: `Found ${listObjectsResult.Contents?.length || 0} objects`,
            data: {
              prefix: listObjectsResult.Prefix,
              count: listObjectsResult.Contents?.length || 0,
              isTruncated: listObjectsResult.IsTruncated
            },
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "ListObjects",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 1.4 Put Object
        try {
          const timer = timeExecution();
          const putObjectCmd = new PutObjectCommand({
            Bucket: bucketName,
            Key: testFileKey,
            Body: testContent,
            ContentType: 'text/plain'
          });
          const putObjectResult = await s3ClientWithKey.send(putObjectCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "PutObject",
            success: true,
            status: putObjectResult.$metadata.httpStatusCode,
            details: `Successfully uploaded test file with key: ${testFileKey}`,
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "PutObject",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 1.5 Get Object
        try {
          const timer = timeExecution();
          const getObjectCmd = new GetObjectCommand({
            Bucket: bucketName,
            Key: testFileKey
          });
          const getObjectResult = await s3ClientWithKey.send(getObjectCmd);
          
          // Convert stream to text
          const bodyContents = await getObjectResult.Body?.transformToString();
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "GetObject",
            success: true,
            status: getObjectResult.$metadata.httpStatusCode,
            details: `Successfully retrieved test file with key: ${testFileKey}`,
            data: {
              contentLength: getObjectResult.ContentLength,
              contentType: getObjectResult.ContentType,
              contentMatches: bodyContents === testContent
            },
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "GetObject",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 1.6 Generate presigned URL
        try {
          const timer = timeExecution();
          const putObjectCmd = new PutObjectCommand({
            Bucket: bucketName,
            Key: `presigned-test-${Date.now()}.txt`,
            ContentType: 'text/plain'
          });
          
          const presignedUrl = await getSignedUrl(s3ClientWithKey, putObjectCmd, { expiresIn: 3600 });
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "GeneratePresignedUrl",
            success: true,
            details: `Successfully generated presigned URL with length ${presignedUrl.length}`,
            data: {
              urlPreview: presignedUrl.substring(0, 50) + '...',
              urlLength: presignedUrl.length
            },
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "GeneratePresignedUrl",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 1.7 Delete test file
        try {
          const timer = timeExecution();
          const deleteObjectCmd = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testFileKey
          });
          const deleteObjectResult = await s3ClientWithKey.send(deleteObjectCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "DeleteObject",
            success: true,
            status: deleteObjectResult.$metadata.httpStatusCode,
            details: `Successfully deleted test file with key: ${testFileKey}`,
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "AccessKey/Secret",
            operation: "DeleteObject",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }
      }
    }

    // 2. TEST R2 TOKEN AUTH
    if (tokenValue && accountId && endpoint) {
      // Create a client with Token
      const s3ClientWithToken = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: accountId,
          secretAccessKey: tokenValue,
        },
        forcePathStyle: true,
      });

      if (bucketName) {
        // 2.1 Head Bucket with Token
        try {
          const timer = timeExecution();
          const headBucketCmd = new HeadBucketCommand({
            Bucket: bucketName
          });
          const headBucketResult = await s3ClientWithToken.send(headBucketCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "HeadBucket",
            success: true,
            status: headBucketResult.$metadata.httpStatusCode,
            details: `Bucket "${bucketName}" exists and is accessible with Token`,
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "HeadBucket",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 2.2 List Objects with Token
        try {
          const timer = timeExecution();
          const listObjectsCmd = new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 5
          });
          const listObjectsResult = await s3ClientWithToken.send(listObjectsCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "ListObjects",
            success: true,
            status: listObjectsResult.$metadata.httpStatusCode,
            details: `Found ${listObjectsResult.Contents?.length || 0} objects using Token auth`,
            data: {
              prefix: listObjectsResult.Prefix,
              count: listObjectsResult.Contents?.length || 0
            },
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "ListObjects",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 2.3 Put Object with Token
        try {
          const timer = timeExecution();
          const tokenTestKey = `token-test-${randomBytes(4).toString('hex')}-${Date.now()}.txt`;
          const putObjectCmd = new PutObjectCommand({
            Bucket: bucketName,
            Key: tokenTestKey,
            Body: "This is a test file uploaded with R2 Token",
            ContentType: 'text/plain'
          });
          const putObjectResult = await s3ClientWithToken.send(putObjectCmd);
          
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "PutObject",
            success: true,
            status: putObjectResult.$metadata.httpStatusCode,
            details: `Successfully uploaded test file with Token auth, key: ${tokenTestKey}`,
            duration: timer()
          });

          // Clean up the test file
          try {
            const deleteObjectCmd = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: tokenTestKey
            });
            await s3ClientWithToken.send(deleteObjectCmd);
          } catch (cleanupError) {
            console.error('Failed to clean up token test file:', cleanupError);
          }
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "PutObject",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }

        // 2.4 Generate presigned URL with Token
        try {
          const timer = timeExecution();
          const putObjectCmd = new PutObjectCommand({
            Bucket: bucketName,
            Key: `token-presigned-test-${Date.now()}.txt`,
            ContentType: 'text/plain'
          });
          
          const presignedUrl = await getSignedUrl(s3ClientWithToken, putObjectCmd, { expiresIn: 3600 });
          
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "GeneratePresignedUrl",
            success: true,
            details: `Successfully generated presigned URL with Token auth`,
            data: {
              urlPreview: presignedUrl.substring(0, 50) + '...',
              urlLength: presignedUrl.length
            },
            duration: timer()
          });
        } catch (error: unknown) {
          const errorDetails = processAWSError(error);
          results.push({
            method: "AWS SDK",
            authType: "R2 Token",
            operation: "GeneratePresignedUrl",
            success: false,
            error: errorDetails.message,
            errorType: errorDetails.name,
            errorCode: errorDetails.code,
            duration: -1
          });
        }
      }
    }

    // 3. HTTP DIRECT ACCESS TESTS
    if (endpoint && bucketName) {
      // 3.1 Try direct HTTP access to bucket
      const directUrl = `${endpoint}/${bucketName}?list-type=2&max-keys=1`;
      try {
        const timer = timeExecution();
        const response = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          },
        });
        
        const responseText = await response.text();
        
        results.push({
          method: "HTTP Direct",
          authType: "None",
          operation: "GetBucket",
          success: response.ok,
          status: response.status,
          details: response.ok ? 'Successfully accessed bucket directly' : `Failed with status ${response.status}`,
          data: {
            contentType: response.headers.get('content-type'),
            responsePreview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          },
          duration: timer()
        });
      } catch (error: unknown) {
        results.push({
          method: "HTTP Direct",
          authType: "None",
          operation: "GetBucket",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : 'UnknownError',
          duration: -1
        });
      }
    }

    if (publicUrl) {
      // 3.2 Try public URL access
      try {
        const timer = timeExecution();
        const publicTestUrl = `${publicUrl}?list-type=2&max-keys=1`;
        const response = await fetch(publicTestUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          },
        });
        
        const responseText = await response.text();
        
        results.push({
          method: "HTTP Direct",
          authType: "None",
          operation: "GetPublicUrl",
          success: response.ok,
          status: response.status,
          details: response.ok ? 'Successfully accessed public URL' : `Failed with status ${response.status}`,
          data: {
            contentType: response.headers.get('content-type'),
            responsePreview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          },
          duration: timer()
        });
      } catch (error: unknown) {
        results.push({
          method: "HTTP Direct",
          authType: "None",
          operation: "GetPublicUrl",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.name : 'UnknownError',
          duration: -1
        });
      }
    }

    // Generate checksums of credentials to help identify copy errors
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

    const totalDuration = Date.now() - startTime;

    // Generate detailed recommendations based on the test results
    const recommendations = generateDetailedRecommendations(results, envInfo);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      duration: `${totalDuration}ms`,
      cloudflareR2Config: {
        ...envInfo,
        accountId: formatCredential(accountId),
      },
      checksums,
      testResults: results,
      summary: generateSummary(results),
      recommendations,
    });
  } catch (error) {
    console.error('R2 Advanced Diagnostic failed:', error);
    return NextResponse.json({
      error: 'R2 Advanced Diagnostic execution failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// Generate a summary of test results
function generateSummary(results: TestResult[]) {
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  
  const authTypes = new Set(results.map(r => r.authType));
  const operations = new Set(results.map(r => r.operation));
  
  const authTypeSummary = Array.from(authTypes).map(authType => {
    const testsForAuthType = results.filter(r => r.authType === authType);
    const successfulForAuthType = testsForAuthType.filter(r => r.success).length;
    
    return {
      authType,
      total: testsForAuthType.length,
      successful: successfulForAuthType,
      failed: testsForAuthType.length - successfulForAuthType,
      successRate: `${Math.round(successfulForAuthType / testsForAuthType.length * 100)}%`
    };
  });
  
  return {
    totalTests,
    successfulTests,
    failedTests,
    successRate: `${Math.round(successfulTests / totalTests * 100)}%`,
    authTypeSummary,
    operations: Array.from(operations)
  };
}

// Generate detailed recommendations based on test results
function generateDetailedRecommendations(results: TestResult[], config: ConfigInfo): string[] {
  const recommendations: string[] = [];
  
  // Check if we have any test results
  if (results.length === 0) {
    recommendations.push("没有测试结果。请检查环境变量是否正确配置。");
    return recommendations;
  }
  
  // Group results by authentication type
  const accessKeyResults = results.filter(r => r.authType === "AccessKey/Secret");
  const tokenResults = results.filter(r => r.authType === "R2 Token");
  const directResults = results.filter(r => r.authType === "None");
  
  // Check success rates
  const accessKeySuccess = accessKeyResults.filter(r => r.success).length;
  const tokenSuccess = tokenResults.filter(r => r.success).length;
  const directSuccess = directResults.filter(r => r.success).length;
  
  const accessKeyRate = accessKeyResults.length > 0 ? accessKeySuccess / accessKeyResults.length : 0;
  const tokenRate = tokenResults.length > 0 ? tokenSuccess / tokenResults.length : 0;
  const directRate = directResults.length > 0 ? directSuccess / directResults.length : 0;
  
  // Overall status
  if (accessKeyRate === 0 && tokenRate === 0 && directRate === 0) {
    recommendations.push("🔴 严重问题：所有连接方式均失败。请查看以下详细建议进行排查。");
  } else if (accessKeyRate > 0 || tokenRate > 0) {
    recommendations.push(`🟢 有希望：至少有一种认证方式部分成功。AccessKey成功率: ${Math.round(accessKeyRate * 100)}%, Token成功率: ${Math.round(tokenRate * 100)}%`);
  }
  
  // Check environment variables
  if (!config.endpoint) {
    recommendations.push("❌ R2_ENDPOINT 未设置，这是必需的环境变量。");
  } else if (!config.endpoint.includes('r2.cloudflarestorage.com')) {
    recommendations.push("❌ R2_ENDPOINT 格式可能不正确，应为 https://{accountid}.r2.cloudflarestorage.com");
  }
  
  if (!config.bucketName) {
    recommendations.push("❌ R2_BUCKET_NAME 未设置，这是必需的环境变量。");
  }
  
  // Check credentials
  const hasAccessKeyCredentials = !!(config.accessKeyId && config.secretAccessKey);
  const hasTokenCredentials = !!(config.tokenValue && config.accountId);
  
  if (!hasAccessKeyCredentials && !hasTokenCredentials) {
    recommendations.push("❌ 没有设置任何有效的认证方式。请设置 R2_ACCESS_KEY_ID 和 R2_SECRET_ACCESS_KEY，或者 R2_TOKEN_VALUE。");
  }
  
  // Analyze errors by authentication type
  if (accessKeyResults.length > 0 && accessKeySuccess === 0) {
    recommendations.push("\n📋 Access Key/Secret 认证方式问题分析：");
    analyzeAuthErrors(accessKeyResults, recommendations);
  }
  
  if (tokenResults.length > 0 && tokenSuccess === 0) {
    recommendations.push("\n📋 R2 Token 认证方式问题分析：");
    analyzeAuthErrors(tokenResults, recommendations);
  }
  
  // Special recommendations for 401 errors (most common with R2)
  const has401 = results.some(r => r.status === 401 || r.errorCode === 401);
  if (has401) {
    recommendations.push("\n🔑 关于 401 Unauthorized 错误的特别说明：");
    recommendations.push("1. 请确认您的密钥格式是否正确，R2 Access Key 通常是一串长的十六进制字符，Secret 更长。");
    recommendations.push("2. R2 Token 通常以连字符开头，例如 `-SK3B...`，确保没有遗漏前导连字符。");
    recommendations.push("3. 账户 ID 必须从 endpoint URL 中正确提取，例如 `https://e6485955ac6c2075560bbfa6905b2815.r2.cloudflarestorage.com` 中的 `e6485955ac6c2075560bbfa6905b2815`。");
    recommendations.push("4. 如果您最近更改了密钥，请确保所有环境变量都已更新。");
    recommendations.push("5. 建议在 Cloudflare R2 控制台中重新生成一个新的 API 令牌，并确保为其分配了正确的存储桶权限。");
  }
  
  // Successful operations but some failures
  const someSuccess = accessKeySuccess > 0 || tokenSuccess > 0;
  if (someSuccess && (accessKeySuccess < accessKeyResults.length || tokenSuccess < tokenResults.length)) {
    recommendations.push("\n⚠️ 部分操作成功，部分失败，可能是权限问题：");
    recommendations.push("1. 确保您的 R2 Token 或 API 密钥具有足够的权限执行所有操作（读取、写入、删除等）。");
    recommendations.push("2. 在 Cloudflare R2 控制台中检查存储桶策略是否限制了某些操作。");
    recommendations.push("3. 如果仅列表操作失败，可能是存储桶为空或权限仅限于特定前缀。");
  }
  
  // Recommendations for presigned URLs
  const presignedResults = results.filter(r => r.operation === "GeneratePresignedUrl");
  const presignedSuccess = presignedResults.filter(r => r.success).length;
  
  if (presignedResults.length > 0 && presignedSuccess === 0) {
    recommendations.push("\n🔗 预签名 URL 生成失败，可能原因：");
    recommendations.push("1. 确保您的凭证有权限生成预签名 URL（需要有写入权限）。");
    recommendations.push("2. 确保 S3Client 配置了正确的 region ('auto' 对于 R2)。");
    recommendations.push("3. 检查 forcePathStyle 是否设置为 true（R2 要求）。");
  }
  
  // Next steps
  recommendations.push("\n🔄 推荐的排查步骤：");
  
  if (accessKeyRate === 0 && tokenRate === 0) {
    recommendations.push("1. 登录 Cloudflare R2 控制台 (https://dash.cloudflare.com/)，检查您的存储桶和 API 密钥。");
    recommendations.push("2. 重新生成一个新的 R2 API 令牌，确保选择正确的存储桶和权限。");
    recommendations.push("3. 使用新生成的令牌更新环境变量，确保包含任何前导字符（如连字符）。");
    recommendations.push("4. 检查存储桶名称拼写是否与控制台完全一致（区分大小写）。");
    recommendations.push("5. 验证 endpoint URL 是否与控制台中显示的一致。");
  } else if (someSuccess) {
    recommendations.push("1. 根据上述分析，优先使用成功率更高的认证方式。");
    
    if (accessKeyRate > tokenRate) {
      recommendations.push("2. AccessKey/Secret 认证方式表现更好，建议继续使用。");
    } else {
      recommendations.push("2. R2 Token 认证方式表现更好，建议继续使用。");
    }
    
    recommendations.push("3. 针对失败的特定操作，检查相关权限设置。");
  }
  
  recommendations.push("\n🛠 其他验证方法：");
  recommendations.push("1. 使用 AWS CLI 测试连接: `aws s3 ls --endpoint-url=<YOUR_R2_ENDPOINT> s3://<YOUR_BUCKET>`");
  recommendations.push("2. 检查 CORS 设置，特别是如果您计划从浏览器直接访问 R2。");
  
  return recommendations;
}

// Analyze errors by authentication type
function analyzeAuthErrors(results: TestResult[], recommendations: string[]) {
  // Extract common error patterns
  const errorCodes = results.map(r => r.errorCode).filter(Boolean);
  const errorTypes = results.map(r => r.errorType).filter(Boolean);
  const errorMessages = results.map(r => r.error).filter(Boolean);
  
  // Look for specific error patterns
  const has401 = errorCodes.includes(401);
  const has403 = errorCodes.includes(403);
  const has404 = errorCodes.includes(404);
  const hasNoSuchBucket = errorMessages.some(msg => msg?.includes('NoSuchBucket'));
  const hasInvalidAccessKeyId = errorMessages.some(msg => msg?.includes('InvalidAccessKeyId'));
  const hasSignatureDoesNotMatch = errorMessages.some(msg => msg?.includes('SignatureDoesNotMatch'));
  const hasConnectionError = errorTypes.includes('ConnectionError') || errorMessages.some(msg => msg?.includes('ECONNREFUSED') || msg?.includes('ETIMEDOUT'));
  
  if (has401 || hasInvalidAccessKeyId) {
    recommendations.push("- 凭证无效或格式错误。请检查 Access Key ID 和 Secret Access Key 是否正确复制，无多余空格。");
    recommendations.push("- R2 Token 必须包含前导连字符，例如 `-SK3B...`。");
  }
  
  if (hasSignatureDoesNotMatch) {
    recommendations.push("- 签名不匹配，表明 Secret Key 可能错误或格式不正确。");
  }
  
  if (has403) {
    recommendations.push("- 凭证有效但权限不足。请在 Cloudflare R2 控制台中确认密钥的权限设置。");
  }
  
  if (has404 || hasNoSuchBucket) {
    recommendations.push("- 存储桶不存在或名称错误。请在 Cloudflare R2 控制台中确认存储桶名称的拼写（区分大小写）。");
  }
  
  if (hasConnectionError) {
    recommendations.push("- 连接错误。请检查网络连接和防火墙设置，确保可以访问 R2 端点。");
  }
}
