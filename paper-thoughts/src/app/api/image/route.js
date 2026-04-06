import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing image ID', { status: 400 });
  }

  try {
    // Explicitly using the Google Drive Thumbnail endpoint server-side 
    // This bypasses browser ORB CORS errors and compresses the image for fast Next.js loading
    const driveUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    
    const response = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch image from Google Drive', { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    // Pass the thumbnail content type (usually image/jpeg)
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    // Cache the image heavily since drive thumbnails rarely change
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error("Image Proxy Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
