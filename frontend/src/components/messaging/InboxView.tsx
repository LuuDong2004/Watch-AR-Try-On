import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Inbox,
  Loader2,
  Send,
  ShieldCheck,
  Store,
  User as UserIcon,
} from 'lucide-react';
import type { ConversationMessage, ConversationSummary, ConversationThread } from '../../api';
import { ApiError } from '../../api';
import { toast } from '../../store/useToast';

interface InboxViewProps {
  conversations: ConversationSummary[];
  /** Whose perspective — fallback for labels when per-thread data is absent. */
  viewerSide: 'customer' | 'staff';
  /** The signed-in user's id — drives "my message" bubble alignment reliably
   *  (works even in mixed-perspective inboxes like the seller's). */
  currentUserId?: string | null;
  loadingList?: boolean;
  error?: string | null;
  emptyText?: string;
  /** Optional header content (e.g. a "compose new" button for the customer). */
  headerExtra?: React.ReactNode;
  /** Pre-select a thread (e.g. when opened from a notification). */
  initialSelectedId?: string | null;
  loadThread: (id: string) => Promise<ConversationThread>;
  onReply: (id: string, body: string) => Promise<ConversationMessage>;
  /** Reload the conversation list (after opening/replying changes unread). */
  onRefresh: () => void;
}

const formatTime = (ts: number) => new Date(ts).toLocaleString('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
});

const roleTag = (role: ConversationMessage['senderRole']) =>
  role === 'ADMIN' ? 'Quản trị' : role === 'SHOP' ? 'Cửa hàng' : 'Khách';

export default function InboxView({
  conversations,
  viewerSide,
  currentUserId,
  loadingList,
  error,
  emptyText = 'Chưa có hội thoại nào.',
  headerExtra,
  initialSelectedId,
  loadThread,
  onReply,
  onRefresh,
}: InboxViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open a thread whenever the selection changes.
  useEffect(() => {
    if (!selectedId) { setThread(null); return; }
    let cancelled = false;
    setLoadingThread(true);
    loadThread(selectedId)
      .then((t) => { if (!cancelled) { setThread(t); onRefresh(); } })
      .catch((e) => { if (!cancelled) toast.error(e instanceof ApiError ? e.message : 'Không tải được hội thoại.'); })
      .finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Follow the latest deep-link selection.
  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread?.messages.length, loadingThread]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !selectedId || !thread) return;
    setSending(true);
    try {
      const msg = await onReply(selectedId, body);
      setThread({ ...thread, messages: [...thread.messages, msg] });
      setDraft('');
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  // The viewer's own role within a given thread (used for labels/prefix).
  const viewerRoleFor = (c: ConversationSummary): ConversationMessage['senderRole'] | null => {
    if (c.viewerIsInitiator === undefined) return viewerSide === 'customer' ? 'CUSTOMER' : null;
    if (c.viewerIsInitiator) return c.initiatorRole ?? 'CUSTOMER';
    return c.targetType === 'ADMIN' ? 'ADMIN' : 'SHOP';
  };

  // Icon for the counterpart (the other side of the thread, from the viewer).
  const CounterIcon = ({ c }: { c: ConversationSummary }) => {
    // Initiator perspective → counterpart is the target (admin or shop).
    const asInitiator = c.viewerIsInitiator ?? (viewerSide === 'customer');
    if (asInitiator) {
      return c.targetType === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <Store className="h-4 w-4" />;
    }
    // Responder perspective → counterpart is the initiator (a shop or a customer).
    return c.initiatorRole === 'SHOP' ? <Store className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />;
  };

  return (
    <div className="grid h-[calc(100vh-9rem)] min-h-[28rem] grid-cols-1 gap-4 md:grid-cols-[20rem_1fr]">
      {/* Conversation list */}
      <aside className={`flex flex-col overflow-hidden rounded-3xl border border-[#e5e0d8] bg-white shadow-sm ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between gap-2 border-b border-[#e5e0d8] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Hội thoại</p>
          {headerExtra}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList && <div className="p-6 text-center text-xs text-gray-400"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#B8924A]" /></div>}
          {!loadingList && error && <div className="p-6 text-center text-xs text-red-500">{error}</div>}
          {!loadingList && !error && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-xs text-gray-400">
              <Inbox className="h-7 w-7 text-gray-300" /> {emptyText}
            </div>
          )}
          {conversations.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition ${
                  active ? 'bg-[#B8924A]/10' : 'hover:bg-gray-50'
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17140F]/5 text-[#B8924A]">
                  <CounterIcon c={c} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-[#17140F]">{c.counterpartName}</p>
                    {c.unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B8924A] px-1 text-[9px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] font-semibold text-gray-600">{c.subject}</p>
                  <p className="truncate text-[11px] text-gray-400">
                    {c.lastSenderRole && c.lastSenderRole === viewerRoleFor(c) ? 'Bạn: ' : ''}
                    {c.lastMessage || '—'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread pane */}
      <section className={`flex flex-col overflow-hidden rounded-3xl border border-[#e5e0d8] bg-white shadow-sm ${selectedId ? 'flex' : 'hidden md:flex'}`}>
        {!thread && !loadingThread && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-gray-400">
            <Inbox className="h-10 w-10 text-gray-200" />
            Chọn một hội thoại để xem nội dung.
          </div>
        )}
        {loadingThread && !thread && (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#B8924A]" /></div>
        )}
        {thread && (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-[#e5e0d8] px-4 py-3">
              <button onClick={() => { setSelectedId(null); setThread(null); }} className="md:hidden text-gray-500 hover:text-[#17140F]">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#17140F]">{thread.conversation.counterpartName}</p>
                <p className="truncate text-[11px] text-gray-400">{thread.conversation.subject}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FAF9F7] p-4">
              {thread.messages.map((m) => {
                const mine = currentUserId
                  ? m.senderId === currentUserId
                  : (viewerSide === 'customer' ? m.senderRole === 'CUSTOMER' : m.senderRole !== 'CUSTOMER');
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      mine ? 'bg-[#17140F] text-white' : 'border border-[#e5e0d8] bg-white text-[#17140F]'
                    }`}>
                      {!mine && (
                        <p className="mb-0.5 text-[10px] font-bold text-[#B8924A]">
                          {m.senderName || roleTag(m.senderRole)} · {roleTag(m.senderRole)}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap leading-5">{m.body}</p>
                      <p className={`mt-1 text-[9px] ${mine ? 'text-white/40' : 'text-gray-400'}`}>{formatTime(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="flex items-end gap-2 border-t border-[#e5e0d8] p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                rows={1}
                placeholder="Nhập tin nhắn… (Enter để gửi)"
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-[#e5e0d8] bg-[#F6F4EF] px-3.5 py-2.5 text-xs focus:border-[#B8924A] focus:bg-white focus:outline-none"
              />
              <button
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#B8924A] text-white transition hover:bg-[#a6803f] disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
