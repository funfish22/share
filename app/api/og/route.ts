import { NextResponse } from 'next/server';

// 解碼 HTML 實體 (處理中文亂碼、Emoji 與圖片網址破圖)
const decodeHTMLEntities = (text: string) => {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (match, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([a-fA-F0-9]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    // 偽裝字串拆分寫法，防止編輯器自動轉成連結
    const fakeUserAgent = 'facebookexternalhit/1.1 (+http://' + '[www.facebook.com/externalhit_uatext.php](https://www.facebook.com/externalhit_uatext.php))';
    const placeholderImg = 'https://' + 'placehold.co/600x400/eeeeee/999999?text=No+Image';

    const response = await fetch(url, {
      headers: {
        'User-Agent': fakeUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    
    const html = await response.text();

    const getMetaTag = (name: string) => {
      const regex1 = new RegExp(`<meta[^>]*(?:property|name)=["'](?:og|twitter):${name}["'][^>]*content=["']([^"']+)["']`, 'i');
      const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og|twitter):${name}["']`, 'i');
      const match = html.match(regex1) || html.match(regex2);
      return match ? decodeHTMLEntities(match[1]) : null;
    };

    return NextResponse.json({
      title: getMetaTag('title') || 'Threads 文章',
      description: getMetaTag('description') || '無法取得預覽文字',
      image: getMetaTag('image') || placeholderImg,
      url: url
    });

  } catch (error) {
    console.error('OG Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
