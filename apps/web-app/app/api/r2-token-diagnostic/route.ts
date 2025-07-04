// apps/web-app/app/api/r2-token-diagnostic/route.ts

import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Get environment variables
    const endpoint = process.env.R2_ENDPOINT;
    const tokenValue = process.env.R2_TOKEN_VALUE;

    // Extract accountId from endpoint URL
    const accountIdMatch = endpoint?.match(/https:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;
    
    if (!endpoint || !tokenValue || !accountId) {
      return NextResponse.json({
        error: 'Missing required environment variables',
        details: {
          hasEndpoint: !!endpoint,
          hasToken: !!tokenValue,
          hasAccountId: !!accountId
        }
      }, { status: 400 });
    }
    
    // Format credentials for display (partial)
    const formatCredential = (value: string) => {
      if (value.length <= 8) return '***' + value.substring(value.length - 2);
      return value.substring(0, 4) + '...' + value.substring(value.length - 4);
    };
    
    // Try variants of token auth to identify the issue
    const testResults = [];
    
    // Test 1: Original token with original account ID
    try {
      console.log(`Test 1: Using original token "${formatCredential(tokenValue)}" with accountId "${formatCredential(accountId)}"`);
      
      const client1 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: accountId,
          secretAccessKey: tokenValue,
        },
        forcePathStyle: true,
      });
      
      const cmd = new ListBucketsCommand({});
      const result = await client1.send(cmd);
      
      testResults.push({
        test: 'Original Token + AccountId',
        success: true,
        buckets: result.Buckets?.length || 0,
        details: 'Connection successful'
      });
    } catch (error) {
      testResults.push({
        test: 'Original Token + AccountId',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: 'Connection failed'
      });
    }
    
    // Test 2: Try without the leading hyphen if the token has one
    if (tokenValue.startsWith('-')) {
      const tokenWithoutHyphen = tokenValue.substring(1);
      
      try {
        console.log(`Test 2: Using token without hyphen "${formatCredential(tokenWithoutHyphen)}" with accountId "${formatCredential(accountId)}"`);
        
        const client2 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accountId,
            secretAccessKey: tokenWithoutHyphen,
          },
          forcePathStyle: true,
        });
        
        const cmd = new ListBucketsCommand({});
        const result = await client2.send(cmd);
        
        testResults.push({
          test: 'Token Without Hyphen + AccountId',
          success: true,
          buckets: result.Buckets?.length || 0,
          details: 'Connection successful'
        });
      } catch (error) {
        testResults.push({
          test: 'Token Without Hyphen + AccountId',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: 'Connection failed'
        });
      }
    }
    
    // Test 3: Try with a hyphen if the token doesn't have one
    if (!tokenValue.startsWith('-')) {
      const tokenWithHyphen = '-' + tokenValue;
      
      try {
        console.log(`Test 3: Using token with added hyphen "${formatCredential(tokenWithHyphen)}" with accountId "${formatCredential(accountId)}"`);
        
        const client3 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: accountId,
            secretAccessKey: tokenWithHyphen,
          },
          forcePathStyle: true,
        });
        
        const cmd = new ListBucketsCommand({});
        const result = await client3.send(cmd);
        
        testResults.push({
          test: 'Token With Added Hyphen + AccountId',
          success: true,
          buckets: result.Buckets?.length || 0,
          details: 'Connection successful'
        });
      } catch (error) {
        testResults.push({
          test: 'Token With Added Hyphen + AccountId',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: 'Connection failed'
        });
      }
    }
    
    // Test 4: Try using token as access key and accountId as secret
    try {
      console.log(`Test 4: Using token "${formatCredential(tokenValue)}" as accessKeyId and accountId "${formatCredential(accountId)}" as secretAccessKey`);
      
      const client4 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: tokenValue,
          secretAccessKey: accountId,
        },
        forcePathStyle: true,
      });
      
      const cmd = new ListBucketsCommand({});
      const result = await client4.send(cmd);
      
      testResults.push({
        test: 'Token as AccessKeyId + AccountId as Secret',
        success: true,
        buckets: result.Buckets?.length || 0,
        details: 'Connection successful'
      });
    } catch (error) {
      testResults.push({
        test: 'Token as AccessKeyId + AccountId as Secret',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: 'Connection failed'
      });
    }

    return NextResponse.json({
      tokenInfo: {
        tokenLength: tokenValue.length,
        tokenPrefix: tokenValue.substring(0, 5),
        tokenSuffix: tokenValue.substring(tokenValue.length - 5),
        hasHyphenPrefix: tokenValue.startsWith('-'),
      },
      accountIdInfo: {
        accountIdLength: accountId.length,
        accountIdPrefix: accountId.substring(0, 5),
        accountIdSuffix: accountId.substring(accountId.length - 5),
      },
      testResults,
      recommendations: generateRecommendations(testResults, tokenValue, accountId)
    });
  } catch (error) {
    console.error('R2 Token Diagnostic failed:', error);
    return NextResponse.json({
      error: 'R2 Token Diagnostic failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

function generateRecommendations(
  testResults: Array<{test: string, success: boolean}>, 
  tokenValue: string, 
  accountId: string
): string[] {
  const recommendations: string[] = [];
  
  const successfulTests = testResults.filter(t => t.success);
  
  if (successfulTests.length > 0) {
    recommendations.push("✅ 有测试成功！根据成功的测试方法更新您的配置。");
    
    successfulTests.forEach(test => {
      if (test.test === 'Token Without Hyphen + AccountId') {
        recommendations.push("- 移除 R2_TOKEN_VALUE 中的前导连字符 '-'");
      } else if (test.test === 'Token With Added Hyphen + AccountId') {
        recommendations.push("- 在 R2_TOKEN_VALUE 前添加连字符 '-'");
      } else if (test.test === 'Token as AccessKeyId + AccountId as Secret') {
        recommendations.push("- 交换 accessKeyId 和 secretAccessKey 的值（在 getR2Client 函数中）");
      }
    });
  } else {
    recommendations.push("❌ 所有测试都失败了。请尝试以下解决方案：");
    recommendations.push("1. 在 Cloudflare R2 控制台中重新生成一个新的 API 令牌");
    recommendations.push("2. 确保为令牌分配了正确的权限（至少需要读取权限）");
    recommendations.push("3. 仔细检查 endpoint URL 和 bucketName 是否正确");
    
    // Token format suggestions
    if (tokenValue.startsWith('-')) {
      recommendations.push("4. 您当前的令牌已包含前导连字符 '-'，这通常是正确的格式");
    } else {
      recommendations.push("4. 您当前的令牌没有前导连字符 '-'，尝试添加一个");
    }
    
    // Check for common format issues
    if (tokenValue.includes(' ')) {
      recommendations.push("5. 您的令牌包含空格，这可能是复制过程中的错误，请删除所有空格");
    }
    
    if (accountId.length !== 32) {
      recommendations.push(`6. 账户 ID 长度为 ${accountId.length}，但通常应为 32 个字符，请检查 endpoint URL 格式`);
    }
  }
  
  return recommendations;
}
