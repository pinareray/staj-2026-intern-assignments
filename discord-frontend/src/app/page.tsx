import ServerSidebar from '@/components/ServerSidebar';
import ChannelSidebar from '@/components/ChannelSidebar';
import ChatArea from '@/components/ChatArea'; // Yeni parçamızı ekledik

export default function Home() {
  return (
    <main className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* 1. Sütun: Sunucular */}
      <ServerSidebar />
      
      {/* 2. Sütun: Kanallar */}
      <ChannelSidebar />
      
      {/* 3. Sütun: Mesaj Alanı */}
      <ChatArea />
    </main>
  );
}