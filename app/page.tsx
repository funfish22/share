"use client";

import { useEffect, useState } from 'react';
import { Bookmark, Loader2, Plus, ExternalLink, Trash2, Inbox, Tag, Share2, X } from 'lucide-react';

interface Clipping {
  id: string;
  status: 'loading' | 'done' | 'error';
  title: string;
  description: string;
  image: string;
  url: string;
  date: string;
  category: string;
}

export default function Home() {
  const [clippings, setClippings] = useState<Clipping[]>([]);
  const [categories, setCategories] = useState<string[]>(['未分類', '設計', '開發', '生活', '搞笑']);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [selectedCategory, setSelectedCategory] = useState<string>('未分類');
  
  const [manualUrl, setManualUrl] = useState('');
  const [incomingShareUrl, setIncomingShareUrl] = useState<string | null>(null); // ★ 新增分享中繼狀態
  const [isClient, setIsClient] = useState(false);

  const errorImageUrl = 'https://' + 'placehold.co/600x400/ffdddd/ff0000?text=Load+Failed';
  const blockedImageUrl = 'https://' + 'placehold.co/600x400/ffdddd/ff0000?text=Image+Blocked';

  useEffect(() => {
    setIsClient(true);
    const savedClippings = JSON.parse(localStorage.getItem('threads_clippings') || '[]');
    setClippings(savedClippings);

    const savedCategories = JSON.parse(localStorage.getItem('threads_categories') || 'null');
    if (savedCategories) {
      setCategories(savedCategories);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    savedClippings.forEach((clip: Clipping) => {
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
        // ★ 不再自動儲存，而是開啟選擇分類的視窗
        setIncomingShareUrl(targetUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('threads_clippings', JSON.stringify(clippings));
      localStorage.setItem('threads_categories', JSON.stringify(categories));
    }
  }, [clippings, categories, isClient]);

  const processAndSaveUrlInstantly = (url: string, targetCategory: string) => {
    const newId = Date.now().toString();
    const newClip: Clipping = {
      id: newId,
      status: 'loading',
      title: '正在擷取 Threads 內容...',
      description: '請稍候，系統正在背景抓取預覽圖與內文',
      image: '',
      url: url,
      date: new Date().toISOString(),
      category: targetCategory
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
    processAndSaveUrlInstantly(manualUrl.trim(), selectedCategory);
    setManualUrl('');
  };

  const deleteClipping = (id: string) => {
    if(confirm('確定要刪除這筆網摘嗎？')) {
      setClippings(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateClipCategory = (id: string, newCategory: string) => {
    setClippings(prev => prev.map(c => c.id === id ? { ...c, category: newCategory } : c));
  };

  const addNewCategory = () => {
    const newCat = prompt('請輸入新分類名稱：');
    if (newCat && newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories(prev => [...prev, newCat.trim()]);
    }
  };

  const clearAll = () => {
    if(confirm('確定要清空所有網摘嗎？')) setClippings([]);
  };

  if (!isClient) return null;

  const filteredClippings = activeCategory === '全部' 
    ? clippings 
    : clippings.filter(c => (c.category || '未分類') === activeCategory);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 pb-10">
      
      {/* ★ 分享確認彈窗 */}
      {incomingShareUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Share2 className="text-blue-500 w-5 h-5" /> 儲存分享內容
              </h2>
              <button onClick={() => setIncomingShareUrl(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 truncate bg-gray-50 p-2 rounded border border-gray-100 italic">
              {incomingShareUrl}
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">請選擇存入分類：</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all border ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                >
                  {cat}
                </button>
              ))}
              <button onClick={addNewCategory} className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-500 flex items-center justify-center gap-1 border border-dashed border-gray-300">
                <Plus className="w-3 h-3" /> 新分類
              </button>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIncomingShareUrl(null)}
                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  processAndSaveUrlInstantly(incomingShareUrl, selectedCategory);
                  setIncomingShareUrl(null);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl transition shadow-lg shadow-blue-200"
              >
                確定儲存
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar mb-2 items-center text-xs">
          <button
            onClick={() => setActiveCategory('全部')}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${activeCategory === '全部' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
          <button onClick={addNewCategory} className="px-3 py-1.5 rounded-full whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> 新增分類
          </button>
        </div>

        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">手動貼上網址與分類：</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm sm:w-32"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input 
              type="url" 
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="貼上 Threads 網址..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleManualSubmit} className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 shrink-0">
              <Plus className="w-4 h-4" /> 儲存
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClippings.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>這個分類目前沒有任何網摘喔！</p>
            </div>
          ) : (
            filteredClippings.map(clip => {
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

              const isPlaceholder = clip.image.includes('placehold.co');
              const finalImageUrl = isPlaceholder ? clip.image : `/api/image?url=${encodeURIComponent(clip.image)}`;

              return (
                <div key={clip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group flex flex-col">
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img 
                      src={finalImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
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
                      <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md max-w-[50%]">
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        <select
                          value={clip.category || '未分類'}
                          onChange={(e) => updateClipCategory(clip.id, e.target.value)}
                          className="text-[10px] bg-transparent border-none focus:ring-0 cursor-pointer p-0 font-medium w-full"
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                        <button onClick={() => deleteClipping(clip.id)} className="text-gray-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
