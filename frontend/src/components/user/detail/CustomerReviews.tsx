import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, MessageCircle, Pencil, Send, Sparkles, Store, Trash2, X } from 'lucide-react';
import { commentApi, ApiError } from '../../../api';
import type { ProductComment, Shop, Watch } from '../../../api';
import { useSession } from '../../../auth/session';
import { useLoginPrompt } from '../../../auth/loginPrompt';
import { toast } from '../../../store/useToast';

interface CustomerReviewsProps {
  watch: Watch;
  shop?: Shop | null;
}

const initialOf = (name: string) => (name || '?').trim().charAt(0).toUpperCase();

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** How many top-level comments to show before the "Xem thêm" button. */
const ROOT_PAGE_SIZE = 5;
/** How many replies to preview under a comment before "Xem thêm N phản hồi". */
const REPLY_PREVIEW = 2;

/** Total number of replies nested under a comment (all depths). */
const countDescendants = (c: ProductComment): number =>
  c.replies.reduce((n, r) => n + 1 + countDescendants(r), 0);

/**
 * Threaded product comments. The platform is display + AR try-on only (no sales),
 * so there are no star ratings — customers leave comments (optionally flagged
 * "đã thử AR"), and the shop can reply Facebook-style. The list shows first and
 * the composer sits at the bottom.
 */
export default function CustomerReviews({ watch, shop }: CustomerReviewsProps) {
  const user = useSession((s) => s.user);
  const showLogin = useLoginPrompt((s) => s.show);

  const [comments, setComments] = useState<ProductComment[]>([]);
  const [visibleCount, setVisibleCount] = useState(ROOT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [triedAr, setTriedAr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isShopOwner = !!user && !!shop?.ownerId && shop.ownerId === user.id;
  const isAdmin = !!user?.roles?.includes('admin');

  const load = async () => {
    try {
      setComments(await commentApi.list(watch.id));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setVisibleCount(ROOT_PAGE_SIZE);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch.id]);

  const countAll = (list: ProductComment[]): number =>
    list.reduce((n, c) => n + 1 + countAll(c.replies), 0);
  const total = countAll(comments);

  const submitTopLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { showLogin('login'); return; }
    if (!body.trim()) { toast.error('Vui lòng nhập nội dung bình luận.'); return; }
    setSubmitting(true);
    try {
      await commentApi.create(watch.id, { body: body.trim(), triedAr });
      setBody('');
      setTriedAr(false);
      await load();
      toast.success('Đã đăng bình luận.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không đăng được bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete: author, shop owner, or admin. Edit: author or admin only.
  const canDelete = (c: ProductComment) => !!user && (user.id === c.userId || isAdmin || isShopOwner);
  const canEdit = (c: ProductComment) => !!user && (user.id === c.userId || isAdmin);

  const handleReply = async (parentId: string, text: string) => {
    await commentApi.create(watch.id, { body: text, parentId });
    await load();
  };

  const handleEdit = async (c: ProductComment, newBody: string, newTried: boolean) => {
    await commentApi.update(watch.id, c.id, { body: newBody, triedAr: newTried });
    await load();
    toast.success('Đã cập nhật bình luận.');
  };

  const handleDelete = async (c: ProductComment) => {
    const ok = await toast.confirm('Xóa bình luận này?', { title: 'Xác nhận', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await commentApi.remove(watch.id, c.id);
      await load();
      toast.success('Đã xóa bình luận.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Không xóa được bình luận.');
    }
  };

  return (
    <div className="rounded-2xl border border-[#e9e3d8] bg-white p-6 shadow-luxe-sm md:p-8">
      <div className="mb-5 flex items-center gap-2 text-sm font-bold text-navy">
        <MessageCircle className="h-4 w-4 text-champagne" />
        {total} bình luận
      </div>

      {/* List (top) */}
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-champagne" /> Đang tải bình luận…
        </div>
      ) : comments.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
      ) : (
        <>
          <div className="space-y-6">
            {comments.slice(0, visibleCount).map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                depth={0}
                canReply={!!user}
                isShopOwner={isShopOwner}
                canEdit={canEdit}
                canDelete={canDelete}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {(comments.length > visibleCount || visibleCount > ROOT_PAGE_SIZE) && (
            <div className="mt-5 flex items-center gap-3">
              {comments.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((n) => n + ROOT_PAGE_SIZE)}
                  className="flex-1 rounded-xl border border-[#e9e3d8] bg-cream/40 py-2.5 text-xs font-bold text-navy transition hover:bg-cream"
                >
                  Xem thêm bình luận ({comments.length - visibleCount} còn lại)
                </button>
              )}
              {visibleCount > ROOT_PAGE_SIZE && (
                <button
                  onClick={() => setVisibleCount(ROOT_PAGE_SIZE)}
                  className="rounded-xl border border-[#e9e3d8] bg-white px-4 py-2.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50"
                >
                  Thu gọn
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Composer (bottom) */}
      <form onSubmit={submitTopLevel} className="mt-8 rounded-2xl border border-[#e9e3d8] bg-cream/40 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={user ? 'Chia sẻ cảm nhận của bạn về mẫu đồng hồ này…' : 'Đăng nhập để bình luận…'}
          className="w-full resize-none rounded-xl border border-[#e9e3d8] bg-white p-3 text-sm focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={triedAr}
              onChange={(e) => setTriedAr(e.target.checked)}
              className="h-4 w-4 accent-champagne"
            />
            <Sparkles className="h-3.5 w-3.5 text-champagne" /> Tôi đã thử AR và thấy phù hợp
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-champagne px-5 py-2.5 text-xs font-bold text-white shadow-luxe transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {user ? 'Đăng bình luận' : 'Đăng nhập để bình luận'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------------------------------------------- Comment node */

/** Stop adding left-indentation past this depth so deep threads never drift off-screen. */
const MAX_INDENT_DEPTH = 3;

interface CommentNodeProps {
  comment: ProductComment;
  depth: number;
  canReply: boolean;
  isShopOwner: boolean;
  canEdit: (c: ProductComment) => boolean;
  canDelete: (c: ProductComment) => boolean;
  onReply: (parentId: string, body: string) => Promise<void>;
  onEdit: (c: ProductComment, body: string, triedAr: boolean) => Promise<void>;
  onDelete: (c: ProductComment) => void;
}

function CommentNode({ comment, depth, canReply, isShopOwner, canEdit, canDelete, onReply, onEdit, onDelete }: CommentNodeProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onReply(comment.id, text.trim());
      setText('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const isReply = depth > 0;
  const shownReplies = repliesExpanded ? comment.replies : comment.replies.slice(0, REPLY_PREVIEW);
  const hiddenReplies = comment.replies.length - shownReplies.length;

  return (
    <div className={isReply ? '' : 'border-b border-[#e9e3d8] pb-6 last:border-0 last:pb-0'}>
      <CommentBody comment={comment} canEdit={canEdit(comment)} canDelete={canDelete(comment)} onEdit={onEdit} onDelete={onDelete} />

          {canReply && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="ml-12 mt-2 text-[11px] font-bold text-champagne transition hover:underline"
            >
              {isShopOwner && depth === 0 ? 'Phản hồi khách hàng' : 'Trả lời'}
            </button>
          )}

          {open && (
            <form onSubmit={submit} className="ml-12 mt-2 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Viết phản hồi…"
                className="flex-1 rounded-xl border border-[#e9e3d8] bg-white px-3 py-2 text-sm focus:border-champagne focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Gửi
              </button>
            </form>
          )}

          {/* Reply thread — collapsible. Indent comes only from the container and stops past
              MAX_INDENT_DEPTH so deep threads flatten instead of cascading off-screen. */}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="ml-12 mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-champagne transition hover:underline"
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              {collapsed ? `Xem ${countDescendants(comment)} phản hồi` : 'Ẩn phản hồi'}
            </button>
          )}

          {comment.replies.length > 0 && !collapsed && (
            <div className={depth < MAX_INDENT_DEPTH ? 'ml-2 mt-4 space-y-4 border-l-2 border-[#efe9dd] pl-3 sm:ml-4 sm:pl-4' : 'mt-4 space-y-4'}>
              {shownReplies.map((r) => (
                <CommentNode
                  key={r.id}
                  comment={r}
                  depth={depth + 1}
                  canReply={canReply}
                  isShopOwner={isShopOwner}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {hiddenReplies > 0 && (
                <button
                  onClick={() => setRepliesExpanded(true)}
                  className="text-[11px] font-bold text-champagne transition hover:underline"
                >
                  Xem thêm {hiddenReplies} phản hồi
                </button>
              )}
            </div>
          )}
    </div>
  );
}

function CommentBody({
  comment,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  comment: ProductComment;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (c: ProductComment, body: string, triedAr: boolean) => Promise<void>;
  onDelete: (c: ProductComment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const [tried, setTried] = useState(comment.triedAr);
  const [busy, setBusy] = useState(false);

  const startEdit = () => { setText(comment.body); setTried(comment.triedAr); setEditing(true); };

  const save = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onEdit(comment, text.trim(), tried);
      setEditing(false);
    } catch {
      /* toast handled upstream */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${
          comment.isShop ? 'bg-navy text-white' : 'border border-champagne/40 bg-champagne/10 text-champagne'
        }`}
      >
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="h-full w-full object-cover" />
        ) : comment.isShop ? (
          <Store className="h-4 w-4" />
        ) : (
          initialOf(comment.authorName)
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-navy">{comment.authorName}</p>
          {comment.isShop && (
            <span className="inline-flex items-center gap-1 rounded-full bg-navy px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
              <Store className="h-2.5 w-2.5" /> Shop
            </span>
          )}
          {comment.triedAr && !editing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
              <Check className="h-2.5 w-2.5" /> Đã thử AR
            </span>
          )}
          <span className="text-[11px] text-gray-400">· {formatDate(comment.createdAt)}</span>
          {(canEdit || canDelete) && !editing && (
            <span className="ml-auto flex items-center gap-1">
              {canEdit && (
                <button onClick={startEdit} title="Sửa" className="text-gray-300 transition hover:text-champagne">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(comment)} title="Xóa" className="text-gray-300 transition hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-[#e9e3d8] bg-white p-2.5 text-sm focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-gray-600">
                <input type="checkbox" checked={tried} onChange={(e) => setTried(e.target.checked)} className="h-3.5 w-3.5 accent-champagne" />
                <Sparkles className="h-3 w-3 text-champagne" /> Đã thử AR phù hợp
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-lg border border-[#e9e3d8] px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-50">
                  <X className="h-3 w-3" /> Hủy
                </button>
                <button onClick={save} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-champagne px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60">
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Lưu
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">{comment.body}</p>
        )}
      </div>
    </div>
  );
}
