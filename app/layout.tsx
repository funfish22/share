import './globals.css'; // ★ 這行最重要，負責載入所有 Tailwind 樣式！

export const metadata = {
  title: '我的 Threads 網摘庫',
  description: '收藏與整理 Threads 文章的好幫手',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '網摘庫',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
