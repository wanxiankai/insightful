// apps/web-app/app/api/r2-credentials-check/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get environment variables
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const tokenValue = process.env.R2_TOKEN_VALUE;
    
    // Extract accountId from endpoint URL
    const accountIdMatch = endpoint?.match(/https:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : null;
    
    // Helper function to sanitize credential display
    const sanitizeCredential = (value: string | undefined | null) => {
      if (!value) return null;
      if (value.length <= 8) return '***' + value.substring(value.length - 2);
      return value.substring(0, 4) + '...' + value.substring(value.length - 4);
    };
    
    // Check if credentials contain any whitespace
    const hasWhitespace = (value: string | undefined | null) => {
      return value ? /\s/.test(value) : false;
    };
    
    return NextResponse.json({
      endpointInfo: {
        value: endpoint,
        isValid: !!endpoint && endpoint.includes('r2.cloudflarestorage.com')
      },
      bucketInfo: {
        value: bucketName,
        isValid: !!bucketName && bucketName.length > 0
      },
      accessKeyInfo: {
        value: sanitizeCredential(accessKeyId),
        isValid: !!accessKeyId && accessKeyId.length > 0,
        length: accessKeyId?.length || 0,
        hasWhitespace: hasWhitespace(accessKeyId)
      },
      secretKeyInfo: {
        value: sanitizeCredential(secretAccessKey),
        isValid: !!secretAccessKey && secretAccessKey.length > 0,
        length: secretAccessKey?.length || 0,
        hasWhitespace: hasWhitespace(secretAccessKey)
      },
      tokenInfo: {
        value: sanitizeCredential(tokenValue),
        isValid: !!tokenValue && tokenValue.length > 0,
        hasHyphenPrefix: tokenValue?.startsWith('-') || false,
        length: tokenValue?.length || 0,
        hasWhitespace: hasWhitespace(tokenValue)
      },
      accountIdInfo: {
        value: sanitizeCredential(accountId),
        extracted: accountId,
        isValid: !!accountId && accountId.length > 0,
        length: accountId?.length || 0
      }
    });
  } catch (error) {
    console.error('R2 Credentials Check failed:', error);
    return NextResponse.json({
      error: 'R2 Credentials Check failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
