// @ts-nocheck
"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button, Input, Modal, TopNav, Toast, PageHeader, DeleteBookModal } from '@/components/shared';
import { IconSearch, IconFilter, IconUpload, IconBook, IconFolder, IconCheck, IconArrow, IconTrash, IconSparkle, IconLoader, IconAlert, IconClose, IconTranslate, IconChevLeft, IconChevRight } from '@/components/icons';
import { fmtSize, fmtDate, needsTranslation } from '@/components/data';
import JSZip from 'jszip';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState({ role: 'user', email: '...', name: 'Loading' });
  const [books, setBooks] = useState([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const roleMatch = document.cookie.match(/role=([^;]+)/);
    const role = roleMatch ? roleMatch[1] : 'user';

    const tokenMatch = document.cookie.match(/token=([^;]+)/);
    let email = '';
    let name = '';
    let id = '';
    if (tokenMatch) {
      try {
        const base64Url = tokenMatch[1].split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        email = payload.email || '';
        name = payload.user_metadata?.name || email.split('@')[0];
        id = payload.sub;
      } catch (e) {}
    }

    setUser({ id, role, email, name });

    fetch('/api/books')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          const mapped = data.map(b => ({
            id: b.id,
            title: b.title,
            subfolder: b.subfolder || 'Unsorted',
            cover: b.cover_url || '',
            fileSizeKb: b.file_size_kb,
            uploadedAt: b.uploaded_at,
            uploadedBy: b.uploaded_by,
            translation: b.translation,
          }));
          setBooks(mapped);
        }
      });
  }, []);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const onLogout = () => {
    document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/');
  };

  return (
    <>
      <TopNav role={user.role} currentPath={pathname} user={user} onNavigate={(p: string) => router.push(p)} onLogout={onLogout} />
      <UserDashboard user={user} books={books} setBooks={setBooks} pushToast={pushToast} />
      <Toast toast={toast} />
    </>
  );
}

declare global {
  interface Window {
    claude: any;
  }
}

// User Dashboard — "My Desk"

function UserDashboard({ user, books, setBooks, pushToast }){
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState('All');
  const [sort, setSort] = useState('recent');
  const [toDelete, setToDelete] = useState(null); 
  const [activeBook, setActiveBook] = useState(null); 
  const [uploads, setUploads] = useState(null);   
  const [chooserOpen, setChooserOpen] = useState(false);
  const fabRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  // Role isolation: users only see books they uploaded; admins see everything.
  const myBooks = useMemo(
    () => user.role === 'admin' ? books : books.filter(b => b.uploadedBy === user.id),
    [books, user]
  );

  const visible = useMemo(() => {
    let list = myBooks.slice();
    if (activeFolder !== 'All') list = list.filter(b => b.subfolder === activeFolder);
    if (query.trim()){
      const q = query.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.subfolder.toLowerCase().includes(q)
      );
    }
    if (sort === 'title')    list.sort((a,b) => a.title.localeCompare(b.title));
    else if (sort === 'size') list.sort((a,b) => b.fileSizeKb - a.fileSizeKb);
    else                      list.sort((a,b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    return list;
  }, [myBooks, query, activeFolder, sort]);

  const folders = useMemo(() => {
    const set = new Set(myBooks.map(b => b.subfolder));
    return ['All', ...Array.from(set).sort()];
  }, [myBooks]);

  // -------- Real Upload via API --------
  const startUpload = async (mode = 'folder') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub';
    if (mode === 'folder') {
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;
    }

    input.onchange = async (e) => {
      const files = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.epub'));
      if (!files.length) return;

      const newUploads = files.map((f, i) => ({
        id: 'u_' + Date.now() + '_' + i,
        title: f.name,
        file: f,
        state: 'queued'
      }));

      setUploads({ items: newUploads, visible: true });

      for (const item of newUploads) {
        updateUpload(item.id, { state: 'extracting' });
        let coverBlob = null;
        let titleStr = item.file.name.replace(/\.epub$/i, '');
        let subfolderStr = 'Unsorted';

        if (mode === 'folder') {
            const parts = item.file.webkitRelativePath.split('/');
            if (parts.length > 1) {
                subfolderStr = parts[0];
            }
        }

        try {
          const zip = await JSZip.loadAsync(item.file);
          let opfPath = '';
          const containerXml = await zip.file('META-INF/container.xml')?.async('text');
          if (containerXml) {
            const match = containerXml.match(/full-path="([^"]+)"/);
            if (match) opfPath = match[1];
          }

          if (opfPath) {
            const opfText = await zip.file(opfPath)?.async('text');
            if (opfText) {
              const parser = new DOMParser();
              const opf = parser.parseFromString(opfText, "application/xml");
              const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

              // Title extraction
              const titleEl = opf.querySelector('title') || opf.getElementsByTagNameNS('*', 'title')[0];
              if (titleEl && titleEl.textContent) {
                titleStr = titleEl.textContent.trim();
              } else {
                const tMatch = opfText.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
                if (tMatch) titleStr = tMatch[1].trim();
              }

              // Extract cover logic
              const extractCover = async () => {
                // 1. Try properties="cover-image"
                const coverItem = opf.querySelector('item[properties="cover-image"]');
                if (coverItem) {
                  const href = coverItem.getAttribute("href");
                  const file = zip.file(opfDir + href) || zip.file(opfDir + decodeURIComponent(href));
                  if (file) return await file.async("blob");
                }

                // 2. Try <meta name="cover">
                const coverMeta = opf.querySelector('meta[name="cover"]');
                if (coverMeta) {
                  const coverId = coverMeta.getAttribute("content");
                  const item = opf.querySelector(`item[id="${coverId}"]`);
                  if (item) {
                    const href = item.getAttribute("href");
                    const file = zip.file(opfDir + href) || zip.file(opfDir + decodeURIComponent(href));
                    if (file) return await file.async("blob");
                  }
                }

                // 3. Try any image item whose id or href contains "cover"
                const allItems = Array.from(opf.querySelectorAll('item'));
                const coverLikeItem = allItems.find(i => 
                   (i.getAttribute('id')?.toLowerCase().includes('cover') || i.getAttribute('href')?.toLowerCase().includes('cover')) &&
                   i.getAttribute('media-type')?.startsWith('image/')
                );
                if (coverLikeItem) {
                   const href = coverLikeItem.getAttribute("href");
                   const file = zip.file(opfDir + href) || zip.file(opfDir + decodeURIComponent(href));
                   if (file) return await file.async("blob");
                }

                // 4. Try cover.xhtml — use regex instead of DOMParser
                const coverXhtml = zip.file(opfDir + "Text/cover.xhtml") 
                                || zip.file(opfDir + "text/cover.xhtml")
                                || zip.file("OEBPS/Text/cover.xhtml");
                if (coverXhtml) {
                  const xhtmlText = await coverXhtml.async("text");
                  
                  // Use regex to extract href from xlink:href or href or src
                  const hrefMatch = xhtmlText.match(/xlink:href="([^"]+\.(jpg|jpeg|png|webp))"/i)
                                 || xhtmlText.match(/href="([^"]+\.(jpg|jpeg|png|webp))"/i)
                                 || xhtmlText.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/i);
                  
                  if (hrefMatch) {
                    const rawHref = hrefMatch[1]; // e.g. "../Images/embed0032_HD.jpg"
                    const filename = rawHref.split("/").pop();
                    const resolved = opfDir + "Images/" + filename;
                    
                    let file = zip.file(resolved);
                    if (!file) {
                      // fallback: search all zip files for this filename
                      const match = Object.keys(zip.files).find(f => f.endsWith(filename));
                      if (match) file = zip.file(match);
                    }
                    if (file) return await file.async("blob");
                  }
                }

                // 5. Final fallback: first jpg/png in Images folder
                const imageFiles = Object.keys(zip.files).filter(f => 
                  f.match(/\.(jpg|jpeg|png)$/i) && f.toLowerCase().includes("images")
                );
                if (imageFiles.length > 0) {
                  return await zip.file(imageFiles[0]).async("blob");
                }

                return null;
              };

              coverBlob = await extractCover();
            }
          }
        } catch (e) {
          console.error("Extraction error:", e);
        }

        updateUpload(item.id, { state: 'uploading', title: titleStr });

        const formData = new FormData();
        formData.append('title', titleStr);
        formData.append('subfolder', subfolderStr);
        formData.append('file_size_kb', Math.round(item.file.size / 1024).toString());
        if (coverBlob) {
            formData.append('cover', coverBlob, 'cover.jpg');
        }

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const mapped = {
                id: data.id,
                title: data.title,
                subfolder: data.subfolder || 'Unsorted',
                cover: data.cover_url || '',
                fileSizeKb: data.file_size_kb,
                uploadedAt: data.uploaded_at,
                uploadedBy: data.uploaded_by,
                translation: data.translation,
            };

            setBooks(prev => [mapped, ...prev]);
            updateUpload(item.id, { state: 'done' });
        } catch (err) {
            console.error("Upload error:", err);
            updateUpload(item.id, { state: 'error' });
        }
      }

      setTimeout(() => {
        setUploads(prev => prev ? { ...prev, visible: false } : prev);
      }, 3000);
    };

    input.click();
  };

  const updateUpload = (id, patch) => {
    setUploads(prev => prev ? ({
      ...prev,
      items: prev.items.map(x => x.id === id ? { ...x, ...patch } : x),
    }) : prev);
  };

  const onTranslate = useCallback(async (book) => {
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, _translateState:'loading' } : b));
    try {
      const res = await fetch(`/api/books/${book.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: book.title })
      });
      const data = await res.json();
      if (!res.ok || !data.translation) throw new Error(data.error || 'translation failed');
      
      setBooks(prev => prev.map(b => b.id === book.id
        ? { ...b, _translateState:'done', translation: data.translation }
        : b));
    } catch (e: any){
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, _translateState:'error', _translateError: e.message } : b));
    }
  }, [setBooks]);

  const activeBookFresh = activeBook ? books.find(b => b.id === activeBook.id) || activeBook : null;

  const onFabClick = () => setChooserOpen(true);
  const handleChoose = (mode) => {
    setChooserOpen(false);
    setTimeout(() => startUpload(mode), 180);
  };

  // -------- Real Delete via API --------
  const confirmDelete = async (book) => {
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setBooks(prev => prev.filter(b => b.id !== book.id));
      setToDelete(null);
      setActiveBook(null);
      pushToast(`"${book.title}" removed`);
    } catch (err) {
      alert("Failed to delete book");
    }
  };

  const isEmpty = myBooks.length === 0;

  return (
    <div className="min-h-screen bg-bg" data-accent="user">
      <main className="max-w-[1280px] mx-auto px-6 pt-10 pb-32">
        <PageHeader
          title="My Desk"
          subtitle={user.role === 'admin'
            ? 'Recently added titles across the entire library.'
            : 'Books you\u2019ve uploaded \u2014 only you and admins can see these.'}
          right={
            <div className="flex items-center gap-2">
              <Input
                icon={<IconSearch size={16}/>}
                placeholder="Search title, folder…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                wrapperClass="w-[260px]"
                accent="user"
              />
              <Button onClick={onFabClick} accent="user">
                <IconUpload size={16}/> Upload
              </Button>
              <div className="relative" ref={filterRef}>
                <Button variant="soft" size="md" onClick={() => setFilterOpen(o => !o)}>
                  <IconFilter size={16}/> Filter
                  {activeFolder !== 'All' && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-user text-white text-[11px] font-medium">1</span>
                  )}
                </Button>
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lift modal-in p-4 z-20">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65 mb-2">Folder</div>
                    <div className="max-h-44 overflow-y-auto -mx-1 pr-1">
                      {folders.map(f => (
                        <button
                          key={f}
                          onClick={() => setActiveFolder(f)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center gap-2 transition cursor-pointer ${activeFolder === f ? 'bg-user text-white' : 'text-ink hover:bg-secondary/30'}`}
                        >
                          {f === 'All' ? <IconBook size={14}/> : <IconFolder size={14}/>}
                          <span className="flex-1">{f}</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65 mb-2 mt-4">Sort by</div>
                    {[
                      { id: 'recent', label: 'Recently added' },
                      { id: 'title',  label: 'Title (A→Z)' },
                      { id: 'size',   label: 'File size' },
                    ].map(s => (
                      <button key={s.id} onClick={() => setSort(s.id)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between transition cursor-pointer ${sort === s.id ? 'text-user font-medium' : 'text-ink hover:bg-secondary/30'}`}>
                        <span>{s.label}</span>
                        {sort === s.id && <IconCheck size={14}/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          }
        />

        {/* Result count */}
        {!isEmpty && (
          <div className="flex items-center justify-between text-[13px] text-ink/65 mb-5">
            <div>
              Showing <span className="text-ink font-medium">{visible.length}</span>
              {visible.length !== myBooks.length && <> of <span className="text-ink font-medium">{myBooks.length}</span></>}
              {' '}{visible.length === 1 ? 'title' : 'titles'}
              {activeFolder !== 'All' && <> in <span className="text-ink font-medium">{activeFolder}</span></>}
              {user.role === 'user' && <> · <span className="text-ink/55">your uploads</span></>}
            </div>
            {(query || activeFolder !== 'All') && (
              <button onClick={() => { setQuery(''); setActiveFolder('All'); }}
                className="text-[12px] text-user hover:underline cursor-pointer">Clear filters</button>
            )}
          </div>
        )}

        {/* Empty state */}
        {isEmpty ? (
          <EmptyState onUpload={onFabClick} />
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-secondary/60 bg-surface/50 py-16 text-center">
            <div className="font-serif text-[22px] text-ink mb-1.5">No titles match.</div>
            <div className="text-sm text-ink/65 mb-5">Try a different search or clear the active folder.</div>
            <Button variant="secondary" onClick={() => { setQuery(''); setActiveFolder('All'); }}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map(b => (
              <CoverCard key={b.id} book={b} onOpen={() => setActiveBook(b)} onDelete={() => setToDelete(b)} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        ref={fabRef}
        onClick={onFabClick}
        className="fixed bottom-8 right-8 z-40 h-14 w-14 rounded-full bg-user text-white shadow-fab grid place-items-center hover:brightness-110 active:scale-95 transition"
        aria-label="Upload books"
        title="Upload a folder of EPUBs"
      >
        <IconUpload size={22}/>
      </button>

      {/* Upload progress panel */}
      <UploadPanel
        uploads={uploads}
        onClose={() => setUploads(prev => prev ? { ...prev, visible: false } : prev)}
      />

      {/* Delete modal */}
      <DeleteBookModal
        book={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        accent="user"
      />

      {/* Upload chooser */}
      <UploadChooserModal
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onChoose={handleChoose}
      />

      {/* Book detail drawer */}
      <BookDetailDrawer
        book={activeBookFresh}
        currentUser={user}
        onClose={() => setActiveBook(null)}
        onDelete={(b) => { setActiveBook(null); setTimeout(() => setToDelete(b), 220); }}
        onTranslate={onTranslate}
      />
    </div>
  );
}

// ---------- Upload chooser ----------
function UploadChooserModal({ open, onClose, onChoose }){
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[560px]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65 mb-1">Add to library</div>
          <div className="font-serif text-[24px] text-ink leading-tight">What would you like to upload?</div>
        </div>
        <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-secondary/40 transition" aria-label="Close">
          <IconClose size={16}/>
        </button>
      </div>
      <p className="text-[13.5px] text-ink/70 leading-relaxed max-w-md">
        Folio reads each .epub for cover art, title, and metadata. Folders are imported recursively.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <ChooserCard
          icon={<IconFolder size={28}/>}
          title="Folder of EPUBs"
          description="Pick a directory — every .epub inside is imported."
          meta="Recommended for batch imports"
          onClick={() => onChoose('folder')}
        />
        <ChooserCard
          icon={<IconBook size={28}/>}
          title="Single .epub file"
          description="Pick one book file to upload."
          meta="Best for one-off additions"
          onClick={() => onChoose('file')}
        />
      </div>
    </Modal>
  );
}

function ChooserCard({ icon, title, description, meta, onClick }){
  return (
    <button
      onClick={onClick}
      className="group text-left bg-bg/70 hover:bg-bg border border-ink/15 hover:border-user rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="h-12 w-12 rounded-lg bg-surface text-ink grid place-items-center mb-3 group-hover:bg-user group-hover:text-white transition">
        {icon}
      </div>
      <div className="font-serif text-[18px] text-ink leading-tight">{title}</div>
      <div className="text-[12.5px] text-ink/70 mt-1.5 leading-relaxed">{description}</div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55 mt-3 flex items-center gap-1.5">
        {meta} <IconArrow size={11} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition"/>
      </div>
    </button>
  );
}

// ---------- Cover card ----------
function CoverCard({ book, onOpen, onDelete }){
  const tr = book.translation;
  const showSub = tr?.english && tr.english !== book.title
    ? tr.english
    : (tr?.romaji && tr.romaji !== book.title ? tr.romaji : null);
  return (
    <div
      className="cover-card group relative bg-surface rounded-xl shadow-card overflow-hidden pop-in cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(); } }}
    >
      <button
        className="trash absolute top-2.5 right-2.5 z-10 h-8 w-8 grid place-items-center rounded-md bg-ink/85 text-white hover:bg-crimson transition"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label={`Delete ${book.title}`}
        title="Delete"
      >
        <IconTrash size={15}/>
      </button>
      {tr && (
        <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 h-6 px-1.5 rounded-md bg-ink/85 text-white text-[10px] font-medium uppercase tracking-[0.12em]">
          <IconSparkle size={10}/> {(tr.language || '').toUpperCase()}
        </div>
      )}
      <div className="aspect-[2/3] w-full overflow-hidden bg-ink/10 relative">
        {book.cover ? (
          <img src={book.cover} alt="" className="w-full h-full object-cover" loading="lazy"/>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 text-ink/40">
            <IconBook size={32}/>
          </div>
        )}
      </div>
      <div className="px-4 pt-3 pb-4">
        <div className="font-serif text-[16px] text-ink truncate-1 leading-snug" title={book.title}>{book.title}</div>
        {showSub && (
          <div className="text-[12px] text-ink/55 italic truncate-1 mt-0.5" title={showSub}>“{showSub}”</div>
        )}
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink/70">
          <IconFolder size={12}/>
          <span className="truncate">{book.subfolder}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Empty state ----------
function EmptyState({ onUpload }){
  return (
    <div className="rounded-2xl border-2 border-dashed border-secondary/70 bg-surface/40 py-20 px-6 text-center">
      <svg width="120" height="90" viewBox="0 0 120 90" className="mx-auto mb-5" fill="none" stroke="#AA968A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="14" y="20" width="92" height="60" rx="6"/>
        <path d="M14 30h92"/>
        <path d="M30 50h26"/>
        <path d="M30 60h44"/>
        <path d="M30 40h14"/>
        <path d="M70 14v18"/>
        <path d="m64 20 6-6 6 6"/>
      </svg>
      <div className="font-serif text-[22px] text-ink mb-1.5">Your desk is empty.</div>
      <p className="text-sm text-ink/70 max-w-md mx-auto mb-6">
        Drop a folder of EPUBs here, or click the button below to browse.
      </p>
      <Button onClick={onUpload}><IconUpload size={16}/> Choose folder</Button>
    </div>
  );
}

// ---------- Upload panel (slide-up) ----------
function UploadPanel({ uploads, onClose }){
  if (!uploads || !uploads.visible) return null;
  const items = uploads.items;
  const done = items.filter(i => i.state === 'done').length;
  const errs = items.filter(i => i.state === 'error').length;
  const total = items.length;
  const pct = Math.round(((done+errs) / total) * 100);
  const allDone = (done + errs) === total;

  const labelFor = (s) => ({
    queued:     'Queued',
    extracting: 'Extracting cover…',
    uploading:  'Uploading…',
    done:       'Done',
    error:      'Error'
  }[s] || s);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
      <div className="max-w-[480px] mx-auto pointer-events-auto bg-surface rounded-2xl shadow-lift slide-up overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-[17px] text-ink">
              {allDone ? 'Upload complete' : 'Uploading books'}
            </div>
            <div className="text-[12px] text-ink/65">{done} of {total} processed · {pct}%</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/70 hover:bg-secondary/30 transition" aria-label="Close">
            <IconClose size={16}/>
          </button>
        </div>
        <div className="h-1 bg-bg">
          <div className="h-full bg-user transition-[width] duration-300 ease-out" style={{ width: pct + '%' }}/>
        </div>
        <ul className="max-h-[260px] overflow-y-auto px-4 py-3 space-y-1.5">
          {items.map(it => (
            <li key={it.id} className="flex items-center gap-3 text-[13px] text-ink py-1">
              <span className="h-5 w-5 grid place-items-center shrink-0">
                {it.state === 'done'
                  ? <span className="h-5 w-5 rounded-full bg-user/15 text-user grid place-items-center"><IconCheck size={12}/></span>
                  : it.state === 'error'
                  ? <span className="h-5 w-5 rounded-full bg-crimson/15 text-crimson grid place-items-center"><IconAlert size={12}/></span>
                  : it.state === 'queued'
                    ? <span className="h-2 w-2 rounded-full bg-ink/30"/>
                    : <span className="text-user"><IconLoader size={14}/></span>}
              </span>
              <span className="flex-1 truncate font-medium" title={it.title}>{it.title}</span>
              <span className="text-[11.5px] text-ink/65 shrink-0">{labelFor(it.state)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Book detail drawer ----------
function BookDetailDrawer({ book, currentUser, onClose, onDelete, onTranslate }){
  useEffect(() => {
    if (!book) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [book, onClose]);

  if (!book) return null;

  const canDelete = currentUser.role === 'admin' || book.uploadedBy === currentUser.id;
  

  const progress = 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop fade-in" onClick={onClose}/>
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-bg shadow-lift drawer-in flex flex-col" data-accent={currentUser.role === 'admin' ? 'admin' : 'user'}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-ink/15">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65">Book details</div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-secondary/40 transition" aria-label="Close">
            <IconClose size={16}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-4 flex gap-5">
            <div className="w-[120px] h-[180px] rounded-md overflow-hidden bg-ink/10 shrink-0 shadow-card relative">
              {book.cover ? (
                <img src={book.cover} alt="" className="w-full h-full object-cover"/>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 text-ink/40">
                  <IconBook size={32}/>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[24px] text-ink leading-[1.15]">{book.title}</div>
              {book.translation?.english && book.translation.english !== book.title && (
                <div className="text-[13px] text-ink/65 italic mt-0.5">“{book.translation.english}”</div>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink/80 bg-surface rounded-md px-2 py-1">
                <IconFolder size={12}/> {book.subfolder}
              </div>
            </div>
          </div>

          <TranslateBlock book={book} onTranslate={onTranslate}/>

          <div className="px-6 pb-5">
            <div className="flex items-center justify-between text-[12px] text-ink/70 mb-1.5">
              <span>Reading progress</span>
              <span className="text-ink font-medium tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-ink/85 transition-all duration-500" style={{ width: progress + '%' }}/>
            </div>
          </div>

          <div className="px-6 pb-5 grid grid-cols-2 gap-x-5 gap-y-3 text-[13px]">
            <Meta label="File size"   value={fmtSize(book.fileSizeKb)} />
            <Meta label="Uploaded"    value={fmtDate(book.uploadedAt)} />
            <Meta label="Format"      value="EPUB 3.0" />
          </div>


        </div>

        <div className="border-t border-ink/15 px-5 py-3 flex items-center gap-2">
          <Button className="flex-1" accent={currentUser.role === 'admin' ? 'admin' : 'user'}>
            <IconBook size={15}/> Open in reader
          </Button>
          {canDelete && (
            <Button variant="ghost" onClick={() => onDelete(book)} className="text-crimson hover:bg-crimson/10">
              <IconTrash size={15}/>
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value, mono }){
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55 mb-0.5">{label}</div>
      <div className={`text-ink ${mono ? 'font-mono text-[12px]' : ''} truncate`}>{value}</div>
    </div>
  );
}

function TranslateBlock({ book, onTranslate }){
  const t = book.translation;
  const state = book._translateState;
  const need = needsTranslation(book.title);

  if (!need && !t){
    return null; 
  }

  return (
    <div className="px-6 pb-5">
      <div className="bg-surface rounded-lg border border-ink/10 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/65">
            <IconSparkle size={12}/> Folio Translate
            <span className="text-[10px] text-ink/45 normal-case tracking-normal font-mono">groq · llama-3.3-70b-versatile</span>
          </div>
          {!t && state !== 'loading' && (
            <button onClick={() => onTranslate(book)}
              className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-ink text-white hover:brightness-110 transition inline-flex items-center gap-1.5">
              <IconTranslate size={13}/> Translate
            </button>
          )}
          {state === 'loading' && (
            <span className="text-[12px] text-ink/65 inline-flex items-center gap-1.5"><IconLoader size={13}/> Translating…</span>
          )}
          {t && (
            <button onClick={() => onTranslate(book)} className="text-[11.5px] text-ink/60 hover:text-ink transition">Retry</button>
          )}
        </div>

        {!t && state !== 'loading' && state !== 'error' && (
          <div className="text-[12.5px] text-ink/70 leading-relaxed">
            This title appears to be in a non-Latin script. Translate to see romanized and English versions.
          </div>
        )}
        {state === 'error' && (
          <div className="text-[12.5px] text-crimson flex items-center gap-1.5"><IconAlert size={13}/> Translation failed: {book._translateError || 'Tap Retry.'}</div>
        )}
        {t && (
          <div className="mt-1">
            <TranslateField label="English Translation"   value={t.english}/>
          </div>
        )}
      </div>
    </div>
  );
}

function TranslateField({ label, value, mono }){
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/55 mb-0.5">{label}</div>
      <div className={`text-[13px] text-ink ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}
