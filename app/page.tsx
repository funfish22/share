"use client";

import { useEffect, useState } from 'react';
import { Bookmark, Loader2, Plus, ExternalLink, Trash2, Inbox } from 'lucide-react';

interface Clipping {
  id: string;
  status: 'loading' | 'done' | 'error';
  title: string;
  description: string;
  image: string;
  url: string;
  date: string;
}

export default function Home() {
  const [clippings, setClippings] = useState<Clipping[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [isClient, setIsClient] = useState(false);

  // 安全的佔位圖片字串 (防止被編輯器解析為 Markdown)
  const errorImageUrl = 'https://' + 'placehold.co/600x400/ffdddd/ff0000?text=Load+Failed';
  const blockedImageUrl = 'https://' + 'placehold.co/600x400/ffdddd/ff0000?text=Image+Blocked';

  useEffect(() => {
    setIsClient(true);
    const saved = JSON.parse(localStorage.getItem('threads_clippings') || '[]');
    setClippings(saved);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    saved.forEach((clip: Clipping) => {
      if (clip.status === 'loading') {
        fetchOgDataInBackground(clip.id, clip.url);
      }
    });
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrlParam = urlParams.get('url') || urlParams.get('text');
    
    if (sharedUrlParam) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matchedUrls = sharedUrlParam.match(urlRegex);
      const targetUrl = matchedUrls ? matchedUrls[0] : null;

      if (targetUrl) {
        processAndSaveUrlInstantly(targetUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('threads_clippings', JSON.stringify(clippings));
    }
  }, [clippings, isClient]);

  const processAndSaveUrlInstantly = (url: string) => {
    const newId = Date.now().toString();
    const newClip: Clipping = {
      id: newId,
      status: 'loading',
      title: '正在擷取 Threads 內容...',
      description: '請稍候，系統正在背景抓取預覽圖與內文',
      image: '',
      url: url,
      date: new Date().toISOString()
    };

    setClippings(prev => [newClip, ...prev]);
    fetchOgDataInBackground(newId, url);
  };

  const fetchOgDataInBackground = async (id: string, url: string) => {
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok) {
        setClippings(prev => prev.map(clip => 
          clip.id === id 
            ? { ...clip, status: 'done', title: data.title, description: data.description, image: data.image }
            : clip
        ));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setClippings(prev => prev.map(clip => 
        clip.id === id 
          ? { 
              ...clip, 
              status: 'error', 
              title: '預覽載入失敗', 
              description: '無法取得預覽資訊，但仍可點擊開啟連結。',
              image: errorImageUrl 
            }
          : clip
      ));
    }
  };

  const handleManualSubmit = () => {
    if (!manualUrl.trim()) return;
    processAndSaveUrlInstantly(manualUrl.trim());
    setManualUrl('');
  };

  const deleteClipping = (id: string) => {
    if(confirm('確定要刪除這筆網摘嗎？')) {
      setClippings(prev => prev.filter(c => c.id !== id));
    }
  };

  const clearAll = () => {
    if(confirm('確定要清空所有網摘嗎？')) setClippings([]);
  };

  if (!isClient) return null;

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="text-blue-500 w-6 h-6" />
            我的網摘庫
          </h1>
          <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-600 transition">
            清空全部
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">手動貼上網址測試：</p>
          <div className="flex gap-2">
            <input 
              type="url" 
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="貼上 Threads 網址..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleManualSubmit} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新增
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clippings.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>目前沒有任何網摘，快去 Threads 分享一篇文章過來吧！</p>
            </div>
          ) : (
            clippings.map(clip => {
              const dateStr = new Date(clip.date).toLocaleString('zh-TW', {
                month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
              });

              if (clip.status === 'loading') {
                return (
                  <div key={clip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="h-48 bg-gray-100 animate-pulse flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6 mb-4"></div>
                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // ★ 終極破防機制：透過我們的代理 API 載入圖片 (除非圖片是我們自己的佔位圖)
              const isPlaceholder = clip.image.includes('placehold.co');
              const finalImageUrl = isPlaceholder ? clip.image : `/api/image?url=${encodeURIComponent(clip.image)}`;

              return (
                <div key={clip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col">
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img 
                      src={finalImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.onerror = null; // 防止無限迴圈
                        e.currentTarget.src = blockedImageUrl;
                      }}
                    />
                    <a href={clip.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                      <ExternalLink className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md w-8 h-8" />
                    </a>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 leading-snug">
                      <a href={clip.url} target="_blank" rel="noreferrer" className="hover:text-blue-600">{clip.title}</a>
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1 whitespace-pre-wrap">{clip.description}</p>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{dateStr}</span>
                      <button onClick={() => deleteClipping(clip.id)} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}