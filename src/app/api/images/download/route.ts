import { NextResponse } from 'next/server';
import axios from 'axios';

const CONFIG = {
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  TIMEOUT: 30000,
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'image/*,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: CONFIG.TIMEOUT,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    const contentType = response.headers['content-type'];
    const filename = url.split('/').pop()?.split('?')[0] || 'image';
    
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    );
  }
} 