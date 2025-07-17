import { NextResponse } from 'next/server';

// 生成唯一ID的工具函数
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API错误响应工具
export function createErrorResponse(message: string, status: number = 500, details?: unknown) {
  const response: { error: string; details?: string } = { error: message };
  if (details) {
    response.details = details instanceof Error ? details.message : String(details);
  }
  return NextResponse.json(response, { status });
}

// 成功响应工具
export function createSuccessResponse(data?: unknown, status: number = 200) {
  const response = data ? { success: true, ...data } : { success: true };
  return NextResponse.json(response, { status });
}

// 常用错误响应
export const apiErrors = {
  unauthorized: () => createErrorResponse('Unauthorized', 401),
  forbidden: () => createErrorResponse('Forbidden', 403),
  notFound: (resource: string = 'Resource') => createErrorResponse(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request') => createErrorResponse(message, 400),
  internal: (message: string = 'Internal server error') => createErrorResponse(message, 500),
} as const;

// 异步错误处理包装器
export async function handleApiRoute<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return createErrorResponse(
      'Internal server error',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
