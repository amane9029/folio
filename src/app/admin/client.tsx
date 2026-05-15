// @ts-nocheck
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarMenu, Button, Input, Modal, Toast, PageHeader, DeleteBookModal } from '@/components/shared';
import { IconList, IconClock, IconSearch, IconTrash, IconFolder, IconChevLeft, IconChevRight, IconUpload, IconShield, IconLogout, IconCheck, IconClose, IconAlert, IconBook, IconCalendar, IconMail, IconCopy } from '@/components/icons';
import { fmtSize, fmtDate, fmtRelative } from '@/components/data';
import { insforge } from '@/lib/insforge';
import { clearAppSession } from '@/lib/client-auth';
import { appendAuditEvent, loadAuditEvents } from '@/lib/audit-log';

const QUOTA_CAP_KB = 256 * 1024;

export default function AdminPageClient({ initialUser, initialBooks }) {
  const router = useRouter();
  const [user] = useState(initialUser);
  const [books, setBooks] = useState(initialBooks);
  const [events, setEvents] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };
  const pushEvent = (kind: string, actor: string, target: string, meta = {}) => {
    setEvents(() => appendAuditEvent(kind, actor, target, meta));
  };

  useEffect(() => {
    setEvents(loadAuditEvents());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key) {
        setEvents(loadAuditEvents());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const sessionKey = `folio-audit-login:${user.email}:admin`;
    if (window.sessionStorage.getItem(sessionKey)) return;

    const next = appendAuditEvent('login', user.email, 'Admin panel', { role: 'admin' });
    setEvents(next);
    window.sessionStorage.setItem(sessionKey, '1');
  }, [user?.email]);
  const onLogout = async () => {
    try {
      await insforge.auth.signOut();
      await clearAppSession();
    } catch (e) {
      console.error('Logout error', e);
    }
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden" data-accent="admin">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_28%)]" />
      <main className="relative z-10 min-h-screen px-0 py-0">
        <section className="min-h-screen border-y border-white/8 bg-[#0a0a0a]/96 overflow-hidden backdrop-blur-xl">
          <div className="h-14 border-b border-white/6 bg-white/[0.02] px-4 sm:px-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-[0_0_0_1px_rgba(0,0,0,0.14)_inset] hover:brightness-110 transition"
              />
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                aria-label="Go to library"
                title="Go to library"
                className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#dea123] shadow-[0_0_0_1px_rgba(0,0,0,0.14)_inset] hover:brightness-110 transition"
              />
              <button
                type="button"
                onClick={() => router.push('/admin')}
                aria-label="Stay on admin"
                title="Stay on admin"
                className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1ea632] shadow-[0_0_0_1px_rgba(0,0,0,0.14)_inset] hover:brightness-110 transition"
              />
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 min-w-0">
                <img src="/main_logo.svg" alt="Folio" className="h-5 w-5 filter invert opacity-95" />
                <span className="font-serif font-bold text-[22px] tracking-tight text-white">Folio</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-7 mr-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="relative px-1.5 h-14 text-[14px] font-medium tracking-tight text-white/60 hover:text-white transition-colors"
              >
                Library
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="relative px-1.5 h-14 text-[14px] font-medium tracking-tight text-white"
              >
                Admin
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-white" />
              </button>
            </nav>
            <div className="block">
              <AvatarMenu user={user} onLogout={onLogout} accent="admin" />
            </div>
          </div>

          <AdminPanel books={books} setBooks={setBooks} events={events} quotaCapKb={QUOTA_CAP_KB} currentUser={user} pushToast={pushToast} pushEvent={pushEvent} />
        </section>
      </main>
      <Toast toast={toast} />
    </div>
  );
}

// Admin Panel — stats + tabs (Library / Audit). Quota meter inline.

function AdminPanel({ books, setBooks, events, quotaCapKb, currentUser, pushToast, pushEvent }){
  const [tab, setTab] = useState('library'); // library | audit
  const [toDelete, setToDelete] = useState(null);
  const [bulkTargets, setBulkTargets] = useState(null); // array of books queued for bulk-delete

  const stats = useMemo(() => {
    const totalKb = books.reduce((s,b) => s + b.fileSizeKb, 0);
    const folders = new Set(books.map(b => b.subfolder));
    const contributors = new Set(books.map(b => b.uploadedBy));
    return {
      total: books.length,
      usedKb: totalKb,
      folders: folders.size,
      contributors: contributors.size,
    };
  }, [books]);

  const confirmDelete = async (b) => {
    setToDelete(null);
    setBooks(prev => prev.filter(x => x.id !== b.id));
    pushEvent && pushEvent('delete', currentUser.email, b.title, { folder: b.subfolder });
    pushToast(`Removed "${b.title}" from library`);

    try {
      const res = await fetch(`/api/books/${b.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (e) {
      setBooks(prev => prev.some(x => x.id === b.id) ? prev : [b, ...prev]);
      pushToast(`Failed to delete "${b.title}". Restored.`);
    }
  };

  const confirmBulkDelete = async (list) => {
    const ids = new Set(list.map(b => b.id));
    setBulkTargets(null);
    setBooks(prev => prev.filter(x => !ids.has(x.id)));
    list.forEach(b => pushEvent && pushEvent('delete', currentUser.email, b.title, { folder: b.subfolder }));
    pushToast(`Removed ${list.length} ${list.length === 1 ? 'book' : 'books'} from library`);

    try {
      await Promise.all(list.map(async (b) => {
        const res = await fetch(`/api/books/${b.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
      }));
    } catch (e) {
      setBooks(prev => {
        const existing = new Set(prev.map(x => x.id));
        const restore = list.filter(x => !existing.has(x.id));
        return [...restore, ...prev];
      });
      pushToast('Failed to delete some books. Restored.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] p-6 sm:p-8 md:p-12" data-accent="admin">
      <div className="pointer-events-none absolute top-[-35%] right-[-10%] h-[70%] w-[45%] rounded-full bg-white/[0.03] blur-[90px]" />
      <main className="relative z-10 max-w-[1400px] mx-auto">
        <PageHeader
          title="Admin Panel"
          subtitle="Manage uploaded EPUB records and audit activity."
        />

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Books"  value={stats.total} primary />
          <StatCard label="Subfolders"   value={stats.folders} />
          <StatCard label="Contributors" value={stats.contributors} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-ink/15">
          <Tab active={tab==='library'} onClick={() => setTab('library')} icon={<IconList size={14}/>}    label="Library"      count={books.length}/>
          <Tab active={tab==='audit'}   onClick={() => setTab('audit')}   icon={<IconClock size={14}/>}   label="Audit log"    count={events.length}/>
        </div>

        {tab === 'library' && (
          <LibraryTab books={books} onDelete={(b) => setToDelete(b)} onBulkDelete={(list) => setBulkTargets(list)}/>
        )}
        {tab === 'audit' && (
          <AuditLogTab events={events}/>
        )}
      </main>

      <DeleteBookModal book={toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} accent="admin"/>
      <BulkDeleteModal books={bulkTargets} onClose={() => setBulkTargets(null)} onConfirm={confirmBulkDelete}/>
    </div>
  );
}

// ---------- Tab pill ----------
function Tab({ active, onClick, icon, label, count }){
  return (
    <button
      onClick={onClick}
      className={`relative px-4 h-10 text-[13px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${active ? 'text-admin' : 'text-ink/65 hover:text-ink'}`}
    >
      {icon} {label}
      {count !== undefined && (
        <span className={`text-[11px] px-1.5 rounded-full tabular-nums ${active ? 'bg-admin text-ink-invert' : 'bg-ink/10 text-ink/70'}`}>{count}</span>
      )}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-admin"/>}
    </button>
  );
}

// ---------- Library tab (table) ----------
function LibraryTab({ books, onDelete, onBulkDelete }){
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortKey, setSortKey] = useState('uploadedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(() => new Set());

  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSel = () => setSelected(new Set());

  const sorted = useMemo(() => {
    const arr = books.filter(b => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return [b.title, b.author, b.subfolder, b.uploadedBy].some(v => v.toLowerCase().includes(q));
    });
    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'uploadedAt'){ av = +new Date(av); bv = +new Date(bv); }
      else if (typeof av === 'string'){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [books, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Reconcile selection when books change underneath us
  useEffect(() => {
    setSelected(prev => {
      const valid = new Set(books.map(b => b.id));
      let changed = false;
      const next = new Set();
      prev.forEach(id => { if (valid.has(id)) next.add(id); else changed = true; });
      return changed ? next : prev;
    });
  }, [books]);

  const pageIds = slice.map(b => b.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const someOnPageSelected = pageIds.some(id => selected.has(id));
  const togglePage = () => setSelected(prev => {
    const next = new Set(prev);
    if (allOnPageSelected) pageIds.forEach(id => next.delete(id));
    else pageIds.forEach(id => next.add(id));
    return next;
  });
  const selectAllMatching = () => setSelected(new Set(sorted.map(b => b.id)));
  const selectedBooks = books.filter(b => selected.has(b.id));

  const setSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'uploadedAt' ? 'desc' : 'asc'); }
  };

  return (
    <div className="bg-surface rounded-xl shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/15 flex items-center gap-3">
        <Input
          icon={<IconSearch size={16}/>}
          placeholder="Search title, folder, contributor…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          accent="admin"
          wrapperClass="max-w-[360px] flex-1"
        />
      </div>

      {selected.size > 0 && (
        <div className="px-5 py-2.5 bg-admin/10 border-b border-admin/25 flex items-center gap-3 text-[13px]">
          <span className="text-ink font-medium">
            {selected.size} selected
          </span>
          {allOnPageSelected && selected.size < sorted.length && (
            <button onClick={selectAllMatching} className="text-[12.5px] text-admin font-medium hover:underline">
              Select all {sorted.length} matching
            </button>
          )}
          <div className="flex-1"/>
          <button onClick={clearSel} className="h-8 px-3 rounded-md text-[12.5px] text-ink/75 hover:bg-bg transition">
            Clear
          </button>
          <button
            onClick={() => onBulkDelete(selectedBooks)}
            className="h-8 px-3 rounded-md text-[12.5px] font-medium bg-crimson text-white hover:brightness-110 transition inline-flex items-center gap-1.5">
            <IconTrash size={13}/> Delete {selected.size}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-[13px]">
          <thead>
            <tr className="text-left text-ink uppercase tracking-[0.12em] text-[11px] border-b border-ink/15">
              <th className="py-3 pl-5 pr-2 w-[36px]">
                <Checkbox
                  checked={allOnPageSelected}
                  indeterminate={!allOnPageSelected && someOnPageSelected}
                  onChange={togglePage}
                  aria-label="Select all on page"
                />
              </th>
              <th className="py-3 pr-3 w-[60px] font-semibold">Cover</th>
              <Th label="Title"        sortKey="title"      cur={sortKey} dir={sortDir} onSort={setSort}/>
              <Th label="Subfolder"    sortKey="subfolder"  cur={sortKey} dir={sortDir} onSort={setSort}/>
              <Th label="Size"         sortKey="fileSizeKb" cur={sortKey} dir={sortDir} onSort={setSort} align="right"/>
              <Th label="Uploaded"     sortKey="uploadedAt" cur={sortKey} dir={sortDir} onSort={setSort}/>
              <Th label="By"           sortKey="uploadedBy" cur={sortKey} dir={sortDir} onSort={setSort}/>
              <th className="py-3 pl-3 pr-5 w-[60px] font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan="8" className="py-16 text-center">
                <div className="font-serif text-[18px] text-ink mb-1">No matching records.</div>
                <div className="text-[13px] text-ink/65">Try a different query.</div>
              </td></tr>
            ) : slice.map((b, i) => {
              const isSel = selected.has(b.id);
              const baseBg = isSel ? 'rgba(255,255,255,.08)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.03)');
              return (
              <tr key={b.id} className="transition-colors"
                style={{ background: baseBg }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = baseBg}>
                <td className="py-2 pl-5 pr-2">
                  <Checkbox checked={isSel} onChange={() => toggleOne(b.id)} aria-label={`Select ${b.title}`}/>
                </td>
                <td className="py-2 pr-3">
                  <div className="w-10 h-[58px] rounded-[3px] overflow-hidden bg-ink/10 shadow-sm relative">
                    {b.cover ? (
                      <img src={b.cover} alt="" className="w-full h-full object-cover"/>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 text-ink/40">
                        <IconBook size={20}/>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <div className="font-serif text-[15px] text-ink leading-tight">{b.title}</div>
                  <div className="text-[12px] text-ink/65">{b.author}</div>
                </td>
                <td className="py-2 pr-3 text-ink/85">
                  <span className="inline-flex items-center gap-1.5"><IconFolder size={12}/> {b.subfolder}</span>
                </td>
                <td className="py-2 pr-3 text-ink/85 tabular-nums text-right">{fmtSize(b.fileSizeKb)}</td>
                <td className="py-2 pr-3 text-ink/85" title={fmtDate(b.uploadedAt)}>{fmtRelative(b.uploadedAt)}</td>
                <td className="py-2 pr-3 text-ink/85 truncate max-w-[200px]">{b.uploadedBy}</td>
                <td className="py-2 pl-3 pr-5 text-right">
                  <button onClick={() => onDelete(b)}
                    className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-crimson hover:text-white transition"
                    title="Delete" aria-label={`Delete ${b.title}`}>
                    <IconTrash size={15}/>
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t border-ink/15 text-[12.5px] text-ink/75">
        <div>
          {sorted.length === 0 ? '0 results'
            : <>Showing <span className="text-ink font-medium">{(page-1)*pageSize + 1}–{Math.min(page*pageSize, sorted.length)}</span> of <span className="text-ink font-medium">{sorted.length}</span></>}
        </div>
        <div className="flex items-center gap-1">
          <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevLeft size={14}/></PageBtn>
          {pageRange(page, totalPages).map((n, i) => n === '…'
            ? <span key={'g'+i} className="px-2 text-ink/55">…</span>
            : <PageBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PageBtn>
          )}
          <PageBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChevRight size={14}/></PageBtn>
        </div>
      </div>
    </div>
  );
}

// ---------- Audit log tab ----------
function AuditLogTab({ events }){
  const [filter, setFilter] = useState('all');
  const filters = [
    { id:'all',    label:'All activity' },
    { id:'upload', label:'Uploads' },
    { id:'delete', label:'Deletions' },
    { id:'login',  label:'Sign-ins' },
  ];
  const visible = events.filter(e => filter === 'all' || e.kind === filter);

  // Group by day
  const groups = useMemo(() => {
    const out = [];
    let cur = null;
    visible.forEach(e => {
      const d = new Date(e.at);
      const key = d.toDateString();
      if (!cur || cur.key !== key){
        cur = { key, label: dayLabel(d), items: [] };
        out.push(cur);
      }
      cur.items.push(e);
    });
    return out;
  }, [visible]);

  return (
    <div className="bg-surface rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-3 border-b border-ink/15 overflow-x-auto">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`h-8 px-3 rounded-full text-[12.5px] font-medium transition whitespace-nowrap
              ${filter === f.id ? 'bg-ink text-ink-invert' : 'text-ink/75 hover:bg-bg'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <div className="font-serif text-[18px] text-ink mb-1">No events to show.</div>
          <div className="text-[13px] text-ink/65">Activity will appear here as users upload, delete, and sign in.</div>
        </div>
      ) : (
        <div>
          {groups.map(g => (
            <div key={g.key}>
              <div className="px-5 py-2 bg-bg/60 text-[11px] uppercase tracking-[0.16em] text-ink/65 sticky top-0 z-10 border-b border-ink/10 flex items-center gap-2">
                <IconCalendar size={12}/> {g.label}
              </div>
              <ul className="divide-y divide-ink/10">
                {g.items.map(ev => <AuditRow key={ev.id} ev={ev}/>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditRow({ ev }){
  const cfg = {
    upload: { label:'Uploaded',     icon:<IconUpload size={13}/>, tone:'text-ink' },
    delete: { label:'Deleted',      icon:<IconTrash size={13}/>,  tone:'text-crimson' },
    login:  { label:'Signed in',    icon:<IconShield size={13}/>, tone:'text-ink/75' },
    logout: { label:'Signed out',   icon:<IconLogout size={13}/>, tone:'text-ink/75' },
  }[ev.kind] || { label:ev.kind, icon:<IconClock size={13}/>, tone:'text-ink' };

  const time = new Date(ev.at).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });

  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-bg/50 transition-colors">
      <span className={`h-7 w-7 rounded-full bg-bg grid place-items-center shrink-0 ${cfg.tone}`}>
        {cfg.icon}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        <div className="text-ink">
          <span className="font-medium">{ev.actor}</span>
          <span className="text-ink/65"> {cfg.label.toLowerCase()} </span>
          <span className="font-medium">{ev.target}</span>
          {ev.meta?.folder && <span className="text-ink/65"> · {ev.meta.folder}</span>}
          {ev.meta?.role && <span className="text-ink/65"> as <span className="text-ink">{ev.meta.role}</span></span>}
          {ev.meta?.size && <span className="text-ink/65"> · {fmtSize(ev.meta.size)}</span>}
        </div>
      </div>
      <div className="text-[12px] text-ink/55 tabular-nums shrink-0">{time}</div>
    </li>
  );
}

function dayLabel(d){
  const today = new Date(); today.setHours(0,0,0,0);
  const that  = new Date(d); that.setHours(0,0,0,0);
  const diff = Math.round((today - that) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return d.toLocaleDateString('en-US', { weekday:'long' });
  return d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
}


function InviteRow({ inv, onRevoke, onResend }){
  const statusCfg = {
    pending:  { label: 'Pending',  cls: 'bg-white text-ink-invert' },
    accepted: { label: 'Accepted', cls: 'bg-bg text-ink border border-ink/20' },
    expired:  { label: 'Expired',  cls: 'bg-bg text-ink/55 border border-ink/15' },
    revoked:  { label: 'Revoked',  cls: 'bg-crimson/15 text-crimson' },
  }[inv.status];

  return (
    <li className="px-5 py-3.5 flex items-center gap-4">
      <div className="h-9 w-9 rounded-full bg-bg grid place-items-center text-ink/70 shrink-0">
        <IconMail size={15}/>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-ink font-medium truncate">{inv.email}</div>
        <div className="text-[12px] text-ink/65 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            {inv.role === 'admin' ? <><IconShield size={11}/> Administrator</> : 'Reader'}
          </span>
          <span className="text-ink/40">·</span>
          <span>Sent {fmtRelative(inv.sentAt)}</span>
          <span className="text-ink/40">·</span>
          <span className="font-mono text-[11px]">by {inv.invitedBy}</span>
        </div>
      </div>
      <span className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full ${statusCfg.cls}`}>{statusCfg.label}</span>
      <div className="flex items-center gap-1">
        {inv.status === 'pending' && (
          <>
            <button onClick={() => onResend(inv)} className="h-8 px-2.5 rounded-md text-[12px] text-ink/75 hover:bg-bg transition" title="Resend">
              Resend
            </button>
            <button onClick={() => onRevoke(inv.id)} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-crimson hover:text-white transition" title="Revoke" aria-label="Revoke invite">
              <IconClose size={14}/>
            </button>
          </>
        )}
        {(inv.status === 'expired' || inv.status === 'revoked') && (
          <button onClick={() => onResend(inv)} className="h-8 px-2.5 rounded-md text-[12px] text-admin hover:bg-bg transition" title="Resend">
            Resend
          </button>
        )}
      </div>
    </li>
  );
}

// ---------- Invite modal ----------
function InviteModal({ open, onClose, onSend, existing }){
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!open) { setEmail(''); setRole('user'); setError(''); setCopied(false); } }, [open]);

  const submit = (e) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)){
      setError('Enter a valid email address.');
      return;
    }
    if (existing.some(i => i.email.toLowerCase() === trimmed && i.status === 'pending')){
      setError('A pending invite already exists for that address.');
      return;
    }
    onSend(trimmed, role);
  };

  const inviteLink = email ? `https://folio.app/invite/${btoa(email).replace(/=+$/,'').slice(0,18)}` : '';
  const copy = () => {
    navigator.clipboard?.writeText(inviteLink).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
      <form onSubmit={submit}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65 mb-1">Onboarding</div>
            <div className="font-serif text-[24px] text-ink leading-tight">Invite a reader</div>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-bg transition" aria-label="Close">
            <IconClose size={16}/>
          </button>
        </div>
        <p className="text-[13px] text-ink/70 leading-relaxed">
          Folio is invite-only. The recipient will receive a one-time link valid for 7 days.
        </p>

        <label className="block mt-5 text-[12px] uppercase tracking-wider text-ink/75 mb-1.5">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="reader@studio.example"
          accent="admin"
          autoFocus
        />

        <div className="mt-4">
          <div className="text-[12px] uppercase tracking-wider text-ink/75 mb-1.5">Role</div>
          <div className="grid grid-cols-2 gap-2" data-accent="admin">
            <RolePick active={role==='user'}  onClick={() => setRole('user')}  title="Reader"        sub="Upload + view own books"/>
            <RolePick active={role==='admin'} onClick={() => setRole('admin')} title="Administrator" sub="Full library + audit"/>
          </div>
        </div>

        {inviteLink && (
          <div className="mt-4 bg-bg rounded-lg border border-ink/15 p-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-ink/55 mb-0.5">Preview link</div>
              <div className="font-mono text-[12px] text-ink truncate">{inviteLink}</div>
            </div>
            <button type="button" onClick={copy} className="h-8 px-2.5 rounded-md text-[12px] text-ink/80 hover:bg-surface transition inline-flex items-center gap-1.5">
              {copied ? <><IconCheck size={13}/> Copied</> : <><IconCopy size={13}/> Copy</>}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-[13px] text-crimson flex items-center gap-2">
            <IconAlert size={14}/> {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" accent="admin"><IconMail size={15}/> Send invite</Button>
        </div>
      </form>
    </Modal>
  );
}

function RolePick({ active, onClick, title, sub }){
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-lg border p-3 transition cursor-pointer
        ${active ? 'border-admin bg-bg' : 'border-ink/15 bg-bg/50 hover:border-ink/40'}`}>
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
        <span className={`h-3.5 w-3.5 rounded-full border ${active ? 'border-admin bg-admin' : 'border-ink/40'} grid place-items-center`}>
          {active && <span className="h-1.5 w-1.5 rounded-full bg-ink-invert"/>}
        </span>
        {title}
      </div>
      <div className="text-[12px] text-ink/65 mt-1 ml-5.5">{sub}</div>
    </button>
  );
}

// ---------- Shared bits ----------
function StatCard({ label, value, suffix, primary }){
  return (
    <div className={`bg-surface rounded-xl shadow-card px-5 py-4 ${primary ? 'ring-1 ring-admin/30' : ''}`}>
      <div className="font-serif font-semibold text-ink text-[40px] leading-none tabular-nums">
        {value}{suffix && <span className="text-[18px] text-ink/65 font-medium ml-1.5">{suffix}</span>}
      </div>
      <div className="mt-1.5 text-[12px] uppercase tracking-[0.16em] text-ink/65">{label}</div>
    </div>
  );
}

function Th({ label, sortKey, cur, dir, onSort, align = 'left' }){
  const active = cur === sortKey;
  return (
    <th className="py-3 pr-3 font-semibold whitespace-nowrap" style={{ textAlign: align }}>
      <button onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 transition-colors ${active ? 'text-admin' : 'text-ink hover:text-admin'}`}>
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
          {active && (dir === 'asc'
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 15 6-6 6 6"/></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
          )}
        </span>
      </button>
    </th>
  );
}

function PageBtn({ children, active, onClick, disabled }){
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[28px] h-8 px-2 rounded-md text-[12.5px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
        ${active ? 'bg-white text-ink-invert' : 'text-ink hover:bg-secondary/30'}`}>
      {children}
    </button>
  );
}

function pageRange(current, total){
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  if (current > 3) out.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

// ---------- Checkbox ----------
function Checkbox({ checked, indeterminate, onChange, ...rest }){
  const state = indeterminate ? 'mixed' : (checked ? 'on' : 'off');
  const stop = (e) => e.stopPropagation();
  const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange?.({ target: { checked: !checked } }); } };
  return (
    <span
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : !!checked}
      tabIndex={0}
      onClick={(e) => { stop(e); onChange?.({ target: { checked: !checked } }); }}
      onKeyDown={onKey}
      className={`inline-grid place-items-center h-[16px] w-[16px] rounded-[4px] border cursor-pointer transition outline-none focus:ring-2 focus:ring-admin/40 ${
        state === 'off'
          ? 'border-ink/35 bg-bg/70 hover:border-ink/55'
          : 'border-admin bg-admin'
      }`}
      {...rest}
    >
      {state === 'on' && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 13 10 18 19 8"/>
        </svg>
      )}
      {state === 'mixed' && <span className="block h-[2px] w-[8px] bg-ink-invert rounded-sm"/>}
    </span>
  );
}

// ---------- Bulk delete confirm ----------
function BulkDeleteModal({ books, onClose, onConfirm }){
  const open = !!books && books.length > 0;
  const [confirmText, setConfirmText] = useState('');
  useEffect(() => { if (!open) setConfirmText(''); }, [open]);

  if (!books) return <Modal open={false} onClose={onClose}/>;
  const matches = confirmText.trim().toUpperCase() === 'DELETE';
  const totalKb = books.reduce((s, b) => s + b.fileSizeKb, 0);
  const previews = books.slice(0, 5);
  const more = books.length - previews.length;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[520px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!matches) return;
          onConfirm(books);
        }}
      >
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-crimson/12 text-crimson grid place-items-center shrink-0">
            <IconAlert size={18}/>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-crimson mb-1">Bulk delete · destructive</div>
            <div className="font-serif text-[22px] text-ink leading-tight">
              Permanently delete {books.length} {books.length === 1 ? 'book' : 'books'}?
            </div>
            <div className="text-[13px] text-ink/70 mt-1.5">
              Frees <span className="text-ink font-medium">{fmtSize(totalKb)}</span>. Files and database records are removed for every reader. There is no undo.
            </div>
          </div>
        </div>

        <ul className="mt-5 bg-bg rounded-lg border border-ink/15 divide-y divide-ink/10 max-h-[200px] overflow-y-auto">
          {previews.map(b => (
            <li key={b.id} className="flex items-center gap-3 px-3 py-2">
              <div className="w-7 h-[42px] rounded-[2px] overflow-hidden bg-ink/10 shrink-0">
                <img src={b.cover} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[14px] text-ink truncate leading-tight">{b.title}</div>
                <div className="text-[11.5px] text-ink/65 mt-0.5 inline-flex items-center gap-1.5">
                  <IconFolder size={11}/> {b.subfolder} · {fmtSize(b.fileSizeKb)}
                </div>
              </div>
            </li>
          ))}
          {more > 0 && (
            <li className="px-3 py-2 text-[12px] text-ink/65 text-center">… and {more} more</li>
          )}
        </ul>

        <div className="mt-4">
          <label className="block text-[11.5px] uppercase tracking-wider text-ink/75 mb-1.5">
            Type <span className="font-mono text-crimson">DELETE</span> to confirm
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches) {
                e.preventDefault();
                onConfirm(books);
              }
            }}
            placeholder="DELETE"
            accent="admin"
            autoFocus
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button
            type="submit"
            disabled={!matches}
            className="h-9 px-4 rounded-lg text-[13px] font-medium bg-crimson text-white inline-flex items-center gap-2 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <IconTrash size={14}/> Permanently delete {books.length}
          </button>
        </div>
      </form>
    </Modal>
  );
}
