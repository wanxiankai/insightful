import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBucketName, getR2Client, getPublicUrl } from '@/lib/r2-client';
import { validateUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const { user, error } = await validateUser();
    if (error) return error;

    // 解析请求体
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 为录制文件保持原始文件名，为其他上传文件生成唯一名称
    const fileExt = filename.split('.').pop();
    let uniqueFileName: string;

    // 如果是录制文件（以 recording_ 开头），保持原始文件名但添加时间戳确保唯一性
    if (filename.startsWith('recording_')) {
      // 保持原始录制文件名，但在用户目录下添加时间戳前缀确保唯一性
      const timestamp = Date.now();
      uniqueFileName = `${timestamp}_${filename}`;
    } else {
      // 其他文件使用 UUID
      uniqueFileName = `${uuidv4()}.${fileExt}`;
    }

    // 生成文件的完整路径，按用户ID组织
    const filePath = `uploads/${user.id}/${uniqueFileName}`;

    // 使用共享 R2 客户端
    const s3Client = await getR2Client();
    const bucketName = getBucketName();

    // 创建预签名URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1小时有效期
    const fileUrl = getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: signedUrl,
      fileUrl: fileUrl,
      fileKey: filePath,
    });

  } catch (error) {
    return NextResponse.json(
      { error: '生成上传链接失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
