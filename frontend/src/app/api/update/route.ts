import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Tái tạo lại bộ nhớ đệm (cache) cho trang chủ
    revalidatePath('/');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache for the home page has been successfully revalidated!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Error revalidating cache' 
    }, { status: 500 });
  }
}
