import React, { useEffect, useState } from 'react';
import { messagingApi, ApiError } from '../../api';
import type { ConversationSummary } from '../../api';
import InboxView from '../messaging/InboxView';

/** Seller inbox: customer messages addressed to the seller's shops. */
export default function ShopInbox() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setConversations(await messagingApi.shopInbox());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được hộp thư.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen w-full bg-[#F6F4EF] p-5 font-sans text-[#17140F] md:p-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Hộp thư cửa hàng</h1>
        <p className="mt-1 text-xs text-gray-500">Tin nhắn từ khách hàng gửi tới cửa hàng của bạn. Trả lời để hỗ trợ khách.</p>
      </header>
      <InboxView
        conversations={conversations}
        viewerSide="staff"
        loadingList={loading}
        error={error}
        emptyText="Chưa có khách hàng nào nhắn tin."
        loadThread={messagingApi.thread}
        onReply={messagingApi.reply}
        onRefresh={load}
      />
    </div>
  );
}
