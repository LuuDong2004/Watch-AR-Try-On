import React, { useEffect, useState } from 'react';
import { messagingApi, ApiError } from '../../api';
import type { ConversationSummary } from '../../api';
import { useSession } from '../../auth/session';
import InboxView from '../messaging/InboxView';

interface AdminInboxProps {
  /** Pre-open a thread (e.g. from the floating chat bubble / notification). */
  initialConversationId?: string | null;
}

/** Admin inbox: support messages from customers and sellers. */
export default function AdminInbox({ initialConversationId }: AdminInboxProps) {
  const userId = useSession((s) => s.user?.id);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);

  const load = async () => {
    try {
      setError(null);
      setConversations(await messagingApi.adminInbox());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được hộp thư.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialConversationId) setSelectedId(initialConversationId); }, [initialConversationId]);

  return (
    <div className="min-h-screen w-full bg-[#F6F4EF] p-5 font-sans text-[#17140F] md:p-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Hộp thư quản trị</h1>
        <p className="mt-1 text-xs text-gray-500">Tin nhắn hỗ trợ từ khách hàng và cửa hàng gửi tới quản trị sàn TrueWrist.</p>
      </header>
      <InboxView
        conversations={conversations}
        viewerSide="staff"
        currentUserId={userId}
        loadingList={loading}
        error={error}
        emptyText="Chưa có tin nhắn hỗ trợ nào."
        initialSelectedId={selectedId}
        loadThread={messagingApi.thread}
        onReply={messagingApi.reply}
        onRefresh={load}
      />
    </div>
  );
}
