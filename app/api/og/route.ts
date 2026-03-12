import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    // 在伺服器端抓取 Threads 網頁，無視 CORS！
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    
    const html = await response.text();

    // 簡單的萃取函數
    const getMetaTag = (name: string) => {
      // 匹配 <meta property="og:xxx" content="..."> 或 <meta content="..." property="og:xxx">
      const regex1 = new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, 'i');
      const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, 'i');
      const match = html.match(regex1) || html.match(regex2);
      return match ? match[1] : null;
    };

    return NextResponse.json({
      title: getMetaTag('title') || '無法取得標題',
      description: getMetaTag('description') || '無法取得預覽文字',
      image: getMetaTag('image') || '[https://placehold.co/600x400/eeeeee/999999?text=No+Image](https://placehold.co/600x400/eeeeee/999999?text=No+Image)',
      url: url
    });

  } catch (error) {
    console.error('OG Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}