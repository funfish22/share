import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    // 偽裝成社群媒體官方機器人，迫使 Threads 交出含有 OG 標籤的預覽版網頁
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+[http://www.facebook.com/externalhit_uatext.php](http://www.facebook.com/externalhit_uatext.php))',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    const html = await response.text();

    // 強化萃取函數，同時支援 og: 與 twitter: 標籤
    const getMetaTag = (name: string) => {
      const regex1 = new RegExp(`<meta[^>]*property=["'](?:og|twitter):${name}["'][^>]*content=["']([^"']+)["']`, 'i');
      const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og|twitter):${name}["']`, 'i');
      const match = html.match(regex1) || html.match(regex2);
      return match ? match[1] : null;
    };

    // 針對 Threads，有時候內文會放在 og:description，標題會在 og:title
    return NextResponse.json({
      title: getMetaTag('title') || 'Threads 文章',
      description: getMetaTag('description') || '無法取得預覽文字',
      image: getMetaTag('image') || '[https://placehold.co/600x400/eeeeee/999999?text=No+Image](https://placehold.co/600x400/eeeeee/999999?text=No+Image)',
      url: url
    });

  } catch (error) {
    console.error('OG Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}