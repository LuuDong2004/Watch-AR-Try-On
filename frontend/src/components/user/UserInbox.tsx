import React, { useEffect, useState } from 'react';
import { Loader2, PenSquare, ShieldCheck, Store, X } from 'lucide-react';
import { messagingApi, shopApi, ApiError } from '../../api';
import type { ConversationSummary, ConversationTarget, Shop } from '../../api';
import { useSession } from '../../auth/session';
import { toast } from '../../store/useToast';
import InboxView from '../messaging/InboxView';

/** Pre-fill the compose modal (e.g. "Nhắn cửa hàng" from a shop/watch page). */
export interface ComposePreset {
  target: ConversationTarget;
  shopId?: string | null;
  shopName?: string | null;
  subject?: string;
}

interface UserInboxProps {
  /** Pre-open a thread (e.g. from a notification). */
  initialConversationId?: string | null;
  /** Auto-open the compose modal with these defaults (e.g. contact a shop). */
  initialCompose?: ComposePreset | null;
  onBackToCatalog?: () => void;
}

export default function UserInbox({ initialConversationId, initialCompose, onBackToCatalog }: UserInboxProps) {
  const userId = useSession((s) => s.user?.id);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [composing, setComposing] = useState(false);
  const [preset, setPreset] = useState<ComposePreset | null>(initialCompose ?? null);

  const load = async () => {
    try {
      setError(null);
      setConversations(await messagingApi.myConversations());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được hộp thư.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialConversationId) setSelectedId(initialConversationId); }, [initialConversationId]);
  useEffect(() => {
    if (initialCompose) { setPreset(initialCompose); setComposing(true); }
  }, [initialCompose]);

  return (
    <div className="min-h-screen w-full bg-[#F6F4EF] p-4 font-sans text-[#17140F] md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Hộp thư của tôi</h1>
            <p className="mt-1 text-xs text-gray-500">Liên hệ với quản trị sàn hoặc cửa hàng và nhận phản hồi tại đây.</p>
          </div>
          {onBackToCatalog && (
            <button onClick={onBackToCatalog} className="text-xs font-semibold text-[#B8924A] hover:underline">
              ← Bộ sưu tập
            </button>
          )}
        </header>

        <InboxView
          conversations={conversations}
          viewerSide="customer"
          currentUserId={userId}
          loadingList={loading}
          error={error}
          emptyText="Bạn chưa có hội thoại nào. Bấm “Soạn tin” để bắt đầu."
          initialSelectedId={selectedId}
          loadThread={messagingApi.thread}
          onReply={messagingApi.reply}
          onRefresh={load}
          headerExtra={
            <button
              onClick={() => { setPreset(null); setComposing(true); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#17140F] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-black"
            >
              <PenSquare className="h-3.5 w-3.5" /> Soạn tin
            </button>
          }
        />
      </div>

      {composing && (
        <ComposeModal
          preset={preset}
          onClose={() => { setComposing(false); setPreset(null); }}
          onCreated={(id) => { setComposing(false); setPreset(null); setSelectedId(id); load(); }}
        />
      )}
    </div>
  );
}

// --- Compose new thread modal ----------------------------------------------

function ComposeModal({
  preset,
  onClose,
  onCreated,
}: {
  preset?: ComposePreset | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [target, setTarget] = useState<ConversationTarget>(preset?.target ?? 'ADMIN');
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState(preset?.shopId ?? '');
  const [subject, setSubject] = useState(preset?.subject ?? '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    shopApi.list().then((list) => setShops(list.filter((s) => s.status !== 'locked'))).catch(() => {});
  }, []);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Vui lòng nhập tiêu đề và nội dung.'); return; }
    if (target === 'SHOP' && !shopId) { toast.error('Vui lòng chọn cửa hàng.'); return; }
    setSending(true);
    try {
      const thread = await messagingApi.start({
        target,
        shopId: target === 'SHOP' ? shopId : null,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success('Đã gửi tin nhắn.');
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
          <h3 className="font-display text-lg font-bold">Soạn tin mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#17140F]"><X className="h-5 w-5" /></button>
        </div>

        {/* Target picker */}
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Gửi tới</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setTarget('ADMIN')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
              target === 'ADMIN' ? 'border-[#B8924A] bg-[#B8924A]/10 text-[#9A7434]' : 'border-[#e5e0d8] text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Quản trị sàn
          </button>
          <button
            onClick={() => setTarget('SHOP')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
              target === 'SHOP' ? 'border-[#B8924A] bg-[#B8924A]/10 text-[#9A7434]' : 'border-[#e5e0d8] text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Store className="h-4 w-4" /> Cửa hàng
          </button>
        </div>

        {target === 'SHOP' && (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="mb-3 w-full rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
          >
            <option value="">— Chọn cửa hàng —</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

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
          placeholder="Nội dung tin nhắn…"
          className="mb-4 w-full resize-none rounded-xl border border-[#e5e0d8] bg-[#F6F4EF] px-3 py-2.5 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-[#e5e0d8] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">Huỷ</button>
          <button
            onClick={() => void submit()}
            disabled={sending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#B8924A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a6803f] disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenSquare className="h-3.5 w-3.5" />}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
