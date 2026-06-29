import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { messagingApi, ApiError } from '../../api';
import type { ConversationSummary } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';
import InboxView from '../messaging/InboxView';

interface ShopInboxProps {
  /** Pre-open a thread (e.g. from the floating chat bubble / notification). */
  initialConversationId?: string | null;
}

/** Seller inbox: customer messages to the shop + the shop's own threads to admins. */
export default function ShopInbox({ initialConversationId }: ShopInboxProps) {
  const userId = useSession((s) => s.user?.id);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [composing, setComposing] = useState(false);

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
  useEffect(() => { if (initialConversationId) setSelectedId(initialConversationId); }, [initialConversationId]);

  return (
    <div className="min-h-screen w-full bg-[#F6F4EF] p-5 font-sans text-[#17140F] md:p-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Hộp thư cửa hàng</h1>
        <p className="mt-1 text-xs text-gray-500">Tin nhắn từ khách hàng và trao đổi với quản trị sàn. Trả lời để hỗ trợ khách.</p>
      </header>
      <InboxView
        conversations={conversations}
        viewerSide="staff"
        currentUserId={userId}
        loadingList={loading}
        error={error}
        emptyText="Chưa có hội thoại nào."
        initialSelectedId={selectedId}
        loadThread={messagingApi.thread}
        onReply={messagingApi.reply}
        onRefresh={load}
        headerExtra={
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#17140F] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-black"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Liên hệ quản trị
          </button>
        }
      />

      {composing && (
        <ContactAdminModal
          onClose={() => setComposing(false)}
          onCreated={(id) => { setComposing(false); setSelectedId(id); load(); }}
        />
      )}
    </div>
  );
}

// --- Seller → admin compose modal ------------------------------------------

function ContactAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Vui lòng nhập tiêu đề và nội dung.'); return; }
    setSending(true);
    try {
      const thread = await messagingApi.startShopToAdmin({ subject: subject.trim(), body: body.trim() });
      toast.success('Đã gửi tin nhắn tới quản trị.');
      onCreated(thread.conversation.id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-[#e5e0d8] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Liên hệ quản trị sàn</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#17140F]"><X className="h-5 w-5" /></button>
        </div>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          placeholder="Tiêu đề"
          className="mb-3 w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="Nội dung cần hỗ trợ…"
          className="mb-4 w-full resize-none rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">Huỷ</button>
          <button
            onClick={() => void submit()}
            disabled={sending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#B8924A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a6803f] disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
