// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AvatarMenu, Modal, Toast, DeleteBookModal } from "@/components/shared";
import {
  IconSearch,
  IconFilter,
  IconUpload,
  IconBook,
  IconFolder,
  IconCheck,
  IconArrow,
  IconTrash,
  IconSparkle,
  IconLoader,
  IconAlert,
  IconClose,
  IconTranslate,
  IconLogout,
} from "@/components/icons";
import { insforge } from "@/lib/insforge";
import { clearAppSession, syncAppSessionFromInsForge } from "@/lib/client-auth";
import JSZip from "jszip";

const fmtSize = (kb?: number) => {
  if (!kb) return "Unknown";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const fmtDate = (dateStr?: string) => {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function DashboardClient({ initialBooks }: { initialBooks: any[] }) {
  const router = useRouter();
  const [user, setUser] = useState({ role: "user", email: "...", name: "Loading" });
  const [books, setBooks] = useState(initialBooks || []);
  const [toast, setToast] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        await syncAppSessionFromInsForge().catch(() => null);

        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.user) {
          if (!cancelled) {
            router.push("/auth");
          }
          return;
        }

        const email = data.user.email || "";
        const name = data.user.name || email.split("@")[0] || "Reader";
        const initials =
          name
            .split(/[\s@._-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "F";

        if (!cancelled) {
          setUser({
            id: data.user.id,
            role: data.role || "user",
            email,
            name,
            initials,
          });
          setAuthReady(true);
        }
      } catch {}
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const loadBooks = async () => {
      try {
        const res = await fetch("/api/books", { cache: "no-store" });

        if (res.status === 401 || res.status === 403) {
          router.push("/auth");
          return;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          console.warn("Failed to fetch books in DashboardClient:", {
            status: res.status,
            statusText: res.statusText,
            data,
          });
          return;
        }

        if (!cancelled && Array.isArray(data)) {
          const mapped = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            subfolder: b.subfolder || "Unsorted",
            cover: b.cover_url || "",
            fileSizeKb: b.file_size_kb,
            uploadedAt: b.uploaded_at,
            uploadedBy: b.user_id || b.uploaded_by,
            translation: b.translation,
          }));
          setBooks(mapped);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to fetch books in DashboardClient:", error);
        }
      }
    };

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [authReady, router]);

  const pushToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const onLogout = async () => {
    try {
      await insforge.auth.signOut();
      await clearAppSession();
    } catch (e) {
      console.error("Logout error", e);
    }
    router.push("/auth");
  };

  return (
    <>
      <UserDashboard
        user={user}
        books={books}
        setBooks={setBooks}
        pushToast={pushToast}
        onLogout={onLogout}
      />
      <Toast toast={toast} />
    </>
  );
}

declare global {
  interface Window {
    claude: any;
  }
}

function UserDashboard({ user, books, setBooks, pushToast, onLogout }) {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState("All");
  const [sort, setSort] = useState("recent");
  const [toDelete, setToDelete] = useState(null);
  const [activeBook, setActiveBook] = useState(null);
  const [uploads, setUploads] = useState(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const fabRef = useRef(null);
  const filterRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDoc = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [searchOpen]);

  const myBooks = useMemo(() => books, [books]);

  const visible = useMemo(() => {
    let list = myBooks.slice();
    if (activeFolder !== "All") list = list.filter((b) => b.subfolder === activeFolder);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) => b.title.toLowerCase().includes(q) || b.subfolder.toLowerCase().includes(q),
      );
    }
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "size") list.sort((a, b) => b.fileSizeKb - a.fileSizeKb);
    else list.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    return list;
  }, [myBooks, query, activeFolder, sort]);

  const folders = useMemo(() => {
    const set = new Set(myBooks.map((b) => b.subfolder));
    return ["All", ...Array.from(set).sort()];
  }, [myBooks]);

  const liveResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return myBooks
      .filter((b) => b.title.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 6);
  }, [myBooks, query]);

  const startUpload = async (mode = "folder") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".epub";
    if (mode === "folder") {
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;
    }

    input.onchange = async (e) => {
      const files = Array.from(e.target.files).filter((f) => f.name.toLowerCase().endsWith(".epub"));
      if (!files.length) return;

      const newUploads = files.map((f, i) => ({
        id: "u_" + Date.now() + "_" + i,
        title: f.name,
        file: f,
        state: "queued",
      }));

      setUploads({ items: newUploads, visible: true });

      for (const item of newUploads) {
        updateUpload(item.id, { state: "extracting" });
        let coverBlob = null;
        let titleStr = item.file.name.replace(/\.epub$/i, "");
        let subfolderStr = "Unsorted";

        if (mode === "folder") {
          const parts = item.file.webkitRelativePath.split("/");
          if (parts.length > 1) {
            subfolderStr = parts[0];
          }
        }

        try {
          const zip = await JSZip.loadAsync(item.file);
          let opfPath = "";
          const containerXml = await zip.file("META-INF/container.xml")?.async("text");
          if (containerXml) {
            const match = containerXml.match(/full-path="([^"]+)"/);
            if (match) opfPath = match[1];
          }

          if (opfPath) {
            const opfText = await zip.file(opfPath)?.async("text");
            if (opfText) {
              const parser = new DOMParser();
              const opf = parser.parseFromString(opfText, "application/xml");
              const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

              const titleEl = opf.querySelector("title") || opf.getElementsByTagNameNS("*", "title")[0];
              if (titleEl && titleEl.textContent) {
                titleStr = titleEl.textContent.trim();
              } else {
                const tMatch = opfText.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
                if (tMatch) titleStr = tMatch[1].trim();
              }

              const extractCover = async () => {
                const coverItem = opf.querySelector('item[properties="cover-image"]');
                if (coverItem) {
                  const href = coverItem.getAttribute("href");
                  const file = zip.file(opfDir + href) || zip.file(opfDir + decodeURIComponent(href));
                  if (file) return await file.async("blob");
                }

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

                const allItems = Array.from(opf.querySelectorAll("item"));
                const coverLikeItem = allItems.find(
                  (i) =>
                    (i.getAttribute("id")?.toLowerCase().includes("cover") ||
                      i.getAttribute("href")?.toLowerCase().includes("cover")) &&
                    i.getAttribute("media-type")?.startsWith("image/"),
                );
                if (coverLikeItem) {
                  const href = coverLikeItem.getAttribute("href");
                  const file = zip.file(opfDir + href) || zip.file(opfDir + decodeURIComponent(href));
                  if (file) return await file.async("blob");
                }

                const coverXhtml =
                  zip.file(opfDir + "Text/cover.xhtml") ||
                  zip.file(opfDir + "text/cover.xhtml") ||
                  zip.file("OEBPS/Text/cover.xhtml");
                if (coverXhtml) {
                  const xhtmlText = await coverXhtml.async("text");
                  const hrefMatch =
                    xhtmlText.match(/xlink:href="([^"]+\.(jpg|jpeg|png|webp))"/i) ||
                    xhtmlText.match(/href="([^"]+\.(jpg|jpeg|png|webp))"/i) ||
                    xhtmlText.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/i);

                  if (hrefMatch) {
                    const rawHref = hrefMatch[1];
                    const filename = rawHref.split("/").pop();
                    const resolved = opfDir + "Images/" + filename;

                    let file = zip.file(resolved);
                    if (!file) {
                      const match = Object.keys(zip.files).find((f) => f.endsWith(filename));
                      if (match) file = zip.file(match);
                    }
                    if (file) return await file.async("blob");
                  }
                }

                const imageFiles = Object.keys(zip.files).filter(
                  (f) => f.match(/\.(jpg|jpeg|png)$/i) && f.toLowerCase().includes("images"),
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

        updateUpload(item.id, { state: "uploading", title: titleStr });

        const formData = new FormData();
        formData.append("title", titleStr);
        formData.append("subfolder", subfolderStr);
        formData.append("file_size_kb", Math.round(item.file.size / 1024).toString());
        if (coverBlob) {
          formData.append("cover", coverBlob, "cover.jpg");
        }

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          const mapped = {
            id: data.id,
            title: data.title,
            subfolder: data.subfolder || "Unsorted",
            cover: data.cover_url || "",
            fileSizeKb: data.file_size_kb,
            uploadedAt: data.uploaded_at,
            uploadedBy: data.uploaded_by,
            translation: data.translation,
          };

          setBooks((prev) => [mapped, ...prev]);
          updateUpload(item.id, { state: "done" });
        } catch (err) {
          console.error("Upload error:", err);
          updateUpload(item.id, { state: "error" });
        }
      }

      setTimeout(() => {
        setUploads((prev) => (prev ? { ...prev, visible: false } : prev));
      }, 3000);
    };

    input.click();
  };

  const updateUpload = (id, patch) => {
    setUploads((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          }
        : prev,
    );
  };

  const onTranslate = useCallback(
    async (book) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, _translateState: "loading" } : b)),
      );
      try {
        const res = await fetch(`/api/books/${book.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: book.title }),
        });
        const data = await res.json();
        if (!res.ok || !data.translation) throw new Error(data.error || "translation failed");

        setBooks((prev) =>
          prev.map((b) =>
            b.id === book.id
              ? { ...b, _translateState: "done", translation: data.translation }
              : b,
          ),
        );
      } catch (e: any) {
        setBooks((prev) =>
          prev.map((b) =>
            b.id === book.id
              ? { ...b, _translateState: "error", _translateError: e.message }
              : b,
          ),
        );
      }
    },
    [setBooks],
  );

  const activeBookFresh = activeBook ? books.find((b) => b.id === activeBook.id) || activeBook : null;

  const onFabClick = () => setChooserOpen(true);
  const handleChoose = (mode) => {
    setChooserOpen(false);
    setTimeout(() => startUpload(mode), 180);
  };

  const confirmDelete = async (book) => {
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setToDelete(null);
      setActiveBook(null);
      pushToast(`"${book.title}" removed`);
    } catch (err) {
      alert("Failed to delete book");
    }
  };

  const isEmpty = myBooks.length === 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden" data-accent="user">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)]" />
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
                aria-hidden="true"
                tabIndex={-1}
                className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#dea123] shadow-[0_0_0_1px_rgba(0,0,0,0.14)_inset] hover:brightness-110 transition"
              />
              <button
                type="button"
                onClick={onFabClick}
                aria-label="Upload books"
                title="Upload books"
                className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1ea632] shadow-[0_0_0_1px_rgba(0,0,0,0.14)_inset] hover:brightness-110 transition"
              />
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 min-w-0">
                <img src="/main_logo.svg" alt="Folio" className="h-5 w-5 filter invert opacity-95" />
                <span className="font-serif font-bold text-[22px] tracking-tight text-white">Folio</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <AvatarMenu user={user} onLogout={onLogout} accent="user" />
            </div>
            <button
              onClick={onLogout}
              className="sm:hidden h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] transition grid place-items-center"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout size={16} />
            </button>
          </div>

          <div className="relative min-h-[calc(100vh-3.5rem)] p-6 sm:p-8 md:p-12">
            <div className="pointer-events-none absolute top-[-35%] right-[-10%] h-[70%] w-[45%] rounded-full bg-white/[0.03] blur-[90px]" />

            <div className="relative z-10 flex flex-col gap-6 max-w-[1360px] mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <h1 className="font-serif text-[42px] sm:text-[52px] md:text-[60px] leading-[0.98] font-semibold text-white tracking-tight">
                    My Collection
                  </h1>
                  <div className="mt-3 text-[15px] text-white/50 flex items-center gap-3">
                    <span>{myBooks.length} {myBooks.length === 1 ? "book" : "books"}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{folders.length - 1} {folders.length - 1 === 1 ? "folder" : "folders"}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                  <div className="relative min-w-0 sm:w-[240px]" ref={searchRef}>
                    <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      placeholder="Search..."
                      className="h-12 w-full rounded-xl bg-white/[0.04] border border-white/10 pl-9 pr-3 text-[14px] text-white placeholder-white/28 focus:border-white/20 transition outline-none"
                    />
                    {searchOpen && query.trim() && (
                      <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-xl border border-white/10 bg-[#111] shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
                        {liveResults.length ? (
                          <div className="py-2">
                            {liveResults.map((book) => (
                              <button
                                key={book.id}
                                type="button"
                                onClick={() => {
                                  setActiveBook(book);
                                  setSearchOpen(false);
                                }}
                                className="w-full px-3 py-2.5 text-left hover:bg-white/[0.06] transition cursor-pointer"
                              >
                                <div className="text-[13px] text-white truncate">{book.title}</div>
                                <div className="text-[11px] text-white/42 truncate mt-0.5">{book.subfolder}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-3 text-[12px] text-white/48">No books found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setFilterOpen((o) => !o)}
                      className="h-12 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-[14px] text-white/72 hover:bg-white/[0.07] hover:border-white/18 transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <IconFilter size={15} />
                      Filter
                      {activeFolder !== "All" && (
                        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#050505] text-[10px] font-bold">
                          1
                        </span>
                      )}
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-[#111] rounded-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] modal-in p-4 z-20">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">Folder</div>
                        <div className="max-h-44 overflow-y-auto -mx-1 pr-1">
                          {folders.map((f) => (
                            <button
                              key={f}
                              onClick={() => setActiveFolder(f)}
                              className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center gap-2 transition cursor-pointer ${
                                activeFolder === f ? "bg-white text-[#050505]" : "text-white/70 hover:bg-white/[0.06]"
                              }`}
                            >
                              {f === "All" ? <IconBook size={14} /> : <IconFolder size={14} />}
                              <span className="flex-1">{f}</span>
                            </button>
                          ))}
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 mt-4">Sort by</div>
                        {[
                          { id: "recent", label: "Recently added" },
                          { id: "title", label: "Title (A-Z)" },
                          { id: "size", label: "File size" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSort(s.id)}
                            className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between transition cursor-pointer ${
                              sort === s.id ? "text-white font-medium" : "text-white/70 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span>{s.label}</span>
                            {sort === s.id && <IconCheck size={14} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onFabClick}
                    className="h-12 px-5 rounded-xl bg-white/[0.05] border border-white/10 text-[14px] font-medium text-white/82 hover:bg-white/[0.08] hover:border-white/18 transition inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Upload Book
                  </button>
                </div>
              </div>

              {!isEmpty && (query || activeFolder !== "All") && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-white/48">
                  <div>
                    Showing <span className="text-white font-medium">{visible.length}</span>
                    {visible.length !== myBooks.length && (
                      <>
                        {" "}of <span className="text-white font-medium">{myBooks.length}</span>
                      </>
                    )}
                    {" "}{visible.length === 1 ? "title" : "titles"}
                    {activeFolder !== "All" && (
                      <>
                        {" "}in <span className="text-white font-medium">{activeFolder}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setQuery("");
                      setActiveFolder("All");
                    }}
                    className="text-[12px] text-white/58 hover:text-white hover:underline cursor-pointer text-left sm:text-right"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {isEmpty ? (
                <EmptyState onUpload={onFabClick} />
              ) : visible.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] py-20 px-6 text-center min-h-[56vh] flex items-center justify-center">
                  <div className="font-serif text-[26px] text-white mb-2">No titles match.</div>
                  <div className="text-sm text-white/50 mb-6">Try a different search or clear the active folder.</div>
                  <button
                    onClick={() => {
                      setQuery("");
                      setActiveFolder("All");
                    }}
                    className="h-10 px-5 rounded-xl border border-white/15 text-[14px] text-white/70 hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {visible.map((b) => (
                    <CoverCard
                      key={b.id}
                      book={b}
                      onOpen={() => setActiveBook(b)}
                      onDelete={() => setToDelete(b)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <button
        ref={fabRef}
        onClick={onFabClick}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-white text-[#050505] shadow-[0_4px_20px_rgba(255,255,255,0.15)] grid place-items-center hover:scale-105 active:scale-95 transition cursor-pointer md:hidden"
        aria-label="Upload books"
        title="Upload a folder of EPUBs"
      >
        <IconUpload size={22} />
      </button>

      <UploadPanel
        uploads={uploads}
        onClose={() => setUploads((prev) => (prev ? { ...prev, visible: false } : prev))}
      />

      <DeleteBookModal
        book={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        accent="user"
      />

      <UploadChooserModal
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onChoose={handleChoose}
      />

      <BookDetailDrawer
        book={activeBookFresh}
        currentUser={user}
        onClose={() => setActiveBook(null)}
        onDelete={(b) => {
          setActiveBook(null);
          setTimeout(() => setToDelete(b), 220);
        }}
        onTranslate={onTranslate}
      />
    </div>
  );
}

function UploadChooserModal({ open, onClose, onChoose }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[560px]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65 mb-1">Add to library</div>
          <div className="font-serif text-[24px] text-ink leading-tight">What would you like to upload?</div>
        </div>
        <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-secondary/40 transition" aria-label="Close">
          <IconClose size={16} />
        </button>
      </div>
      <p className="text-[13.5px] text-ink/70 leading-relaxed max-w-md">
        Folio reads each .epub for cover art, title, and metadata. Folders are imported recursively.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <ChooserCard
          icon={<IconFolder size={28} />}
          title="Folder of EPUBs"
          description="Pick a directory - every .epub inside is imported."
          meta="Recommended for batch imports"
          onClick={() => onChoose("folder")}
        />
        <ChooserCard
          icon={<IconBook size={28} />}
          title="Single .epub file"
          description="Pick one book file to upload."
          meta="Best for one-off additions"
          onClick={() => onChoose("file")}
        />
      </div>
    </Modal>
  );
}

function ChooserCard({ icon, title, description, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-bg/70 hover:bg-bg border border-ink/15 hover:border-user rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="h-12 w-12 rounded-lg bg-surface text-ink grid place-items-center mb-3 group-hover:bg-user group-hover:text-ink-invert transition">
        {icon}
      </div>
      <div className="font-serif text-[18px] text-ink leading-tight">{title}</div>
      <div className="text-[12.5px] text-ink/70 mt-1.5 leading-relaxed">{description}</div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55 mt-3 flex items-center gap-1.5">
        {meta} <IconArrow size={11} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
      </div>
    </button>
  );
}

function CoverCard({ book, onOpen, onDelete }) {
  const tr = book.translation;
  const showSub = tr?.english && tr.english !== book.title
    ? tr.english
    : tr?.romaji && tr.romaji !== book.title
      ? tr.romaji
      : null;

  return (
    <div
      className="group relative rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,255,255,0.05)]"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
    >
      <div className="relative rounded-[15px] bg-[#111] min-h-full border border-white/6 overflow-hidden transition-colors group-hover:border-white/18">
        <button
          className="absolute top-3 right-3 z-10 h-8 w-8 grid place-items-center rounded-md bg-black/60 text-white/60 opacity-0 group-hover:opacity-100 hover:bg-crimson hover:text-white transition-all backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${book.title}`}
          title="Delete"
        >
          <IconTrash size={15} />
        </button>

        {tr && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 h-6 px-1.5 rounded-md bg-black/60 text-white/70 text-[10px] font-medium uppercase tracking-[0.12em] backdrop-blur-sm">
            <IconSparkle size={10} /> {(tr.language || "").toUpperCase()}
          </div>
        )}

        <div className="aspect-[2/3] w-full overflow-hidden relative">
          {book.cover ? (
            <img src={book.cover} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-between p-5 bg-[#111]">
              <div className="text-[10px] uppercase tracking-widest text-white/28 font-medium">EPUB</div>
              <div />
            </div>
          )}
        </div>

        <div className="px-5 pt-4 pb-5">
          <div className="font-serif text-[18px] text-white/92 leading-snug truncate" title={book.title}>{book.title}</div>
          {showSub && (
            <div className="text-[12px] text-white/40 italic truncate mt-1" title={showSub}>
              "{showSub}"
            </div>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/40">
            <IconFolder size={11} />
            <span className="truncate">{book.subfolder}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div className="rounded-[30px] border border-white/7 bg-white/[0.015] py-20 sm:py-28 px-6 text-center min-h-[430px] flex items-center justify-center">
      <div>
        <svg width="120" height="90" viewBox="0 0 120 90" className="mx-auto mb-6" fill="none" stroke="#444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="20" width="92" height="60" rx="6" />
          <path d="M14 30h92" />
          <path d="M30 50h26" />
          <path d="M30 60h44" />
          <path d="M30 40h14" />
          <path d="M70 14v18" />
          <path d="m64 20 6-6 6 6" />
        </svg>
        <div className="font-serif text-[28px] sm:text-[34px] text-white mb-2">Your desk is empty.</div>
        <p className="text-[15px] text-white/46 max-w-lg mx-auto mb-8 leading-relaxed">
          Drop a folder of EPUBs here, or click the button below to browse.
        </p>
        <button
          onClick={onUpload}
          className="h-12 px-7 rounded-2xl bg-white text-[#050505] text-[14px] font-bold hover:scale-105 transition-transform cursor-pointer inline-flex items-center gap-2 shadow-[0_0_18px_rgba(255,255,255,0.12)]"
        >
          <IconUpload size={16} /> Choose folder
        </button>
      </div>
    </div>
  );
}

function UploadPanel({ uploads, onClose }) {
  if (!uploads || !uploads.visible) return null;
  const items = uploads.items;
  const done = items.filter((i) => i.state === "done").length;
  const errs = items.filter((i) => i.state === "error").length;
  const total = items.length;
  const pct = Math.round(((done + errs) / total) * 100);
  const allDone = done + errs === total;

  const labelFor = (s) =>
    ({
      queued: "Queued",
      extracting: "Extracting cover...",
      uploading: "Uploading...",
      done: "Done",
      error: "Error",
    }[s] || s);

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
      <div className="max-w-[480px] mx-auto pointer-events-auto bg-surface rounded-2xl shadow-lift slide-up overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-[17px] text-ink">
              {allDone ? "Upload complete" : "Uploading books"}
            </div>
            <div className="text-[12px] text-ink/65">
              {done} of {total} processed · {pct}%
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/70 hover:bg-secondary/30 transition" aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>
        <div className="h-1 bg-bg">
          <div className="h-full bg-user transition-[width] duration-300 ease-out" style={{ width: pct + "%" }} />
        </div>
        <ul className="max-h-[260px] overflow-y-auto px-4 py-3 space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 text-[13px] text-ink py-1">
              <span className="h-5 w-5 grid place-items-center shrink-0">
                {it.state === "done" ? (
                  <span className="h-5 w-5 rounded-full bg-user/15 text-user grid place-items-center">
                    <IconCheck size={12} />
                  </span>
                ) : it.state === "error" ? (
                  <span className="h-5 w-5 rounded-full bg-crimson/15 text-crimson grid place-items-center">
                    <IconAlert size={12} />
                  </span>
                ) : it.state === "queued" ? (
                  <span className="h-2 w-2 rounded-full bg-ink/30" />
                ) : (
                  <span className="text-user">
                    <IconLoader size={14} />
                  </span>
                )}
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

function BookDetailDrawer({ book, currentUser, onClose, onDelete, onTranslate }) {
  useEffect(() => {
    if (!book) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [book, onClose]);

  if (!book) return null;

  const canDelete = currentUser.role === "admin" || book.uploadedBy === currentUser.id;
  const progress = 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-bg shadow-lift drawer-in flex flex-col" data-accent={currentUser.role === "admin" ? "admin" : "user"}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-ink/15">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/65">Book details</div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md text-ink/65 hover:bg-secondary/40 transition" aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-4 flex gap-5">
            <div className="w-[120px] h-[180px] rounded-md overflow-hidden bg-ink/10 shrink-0 shadow-card relative">
              {book.cover ? (
                <img src={book.cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 text-ink/40">
                  <IconBook size={32} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[24px] text-ink leading-[1.15]">{book.title}</div>
              {book.translation?.english && book.translation.english !== book.title && (
                <div className="text-[13px] text-ink/65 italic mt-0.5">"{book.translation.english}"</div>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-ink/80 bg-surface rounded-md px-2 py-1">
                <IconFolder size={12} /> {book.subfolder}
              </div>
            </div>
          </div>

          <TranslateBlock book={book} onTranslate={onTranslate} />

          <div className="px-6 pb-5">
            <div className="flex items-center justify-between text-[12px] text-ink/70 mb-1.5">
              <span>Reading progress</span>
              <span className="text-ink font-medium tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-ink/85 transition-all duration-500" style={{ width: progress + "%" }} />
            </div>
          </div>

          <div className="px-6 pb-5 grid grid-cols-2 gap-x-5 gap-y-3 text-[13px]">
            <Meta label="File size" value={fmtSize(book.fileSizeKb)} />
            <Meta label="Uploaded" value={fmtDate(book.uploadedAt)} />
            <Meta label="Format" value="EPUB 3.0" />
          </div>
        </div>

        {canDelete && (
          <div className="border-t border-ink/15 px-5 py-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onDelete(book)}
              className="h-10 px-4 rounded-lg text-[13px] font-medium text-crimson border border-crimson/25 hover:bg-crimson/10 transition inline-flex items-center gap-2"
            >
              <IconTrash size={15} />
              Delete book
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55 mb-0.5">{label}</div>
      <div className={`text-ink ${mono ? "font-mono text-[12px]" : ""} truncate`}>{value}</div>
    </div>
  );
}

function TranslateBlock({ book, onTranslate }) {
  const t = book.translation;
  const state = book._translateState;
  const need = needsTranslation(book.title);

  if (!need && !t) {
    return null;
  }

  return (
    <div className="px-6 pb-5">
      <div className="bg-surface rounded-lg border border-ink/10 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/65">
            <IconSparkle size={12} /> Folio Translate
            <span className="text-[10px] text-ink/45 normal-case tracking-normal font-mono">
              groq · llama-3.3-70b-versatile
            </span>
          </div>
          {!t && state !== "loading" && (
            <button
              onClick={() => onTranslate(book)}
              className="h-7 px-2.5 rounded-md text-[12px] font-medium bg-white text-ink-invert hover:brightness-90 transition inline-flex items-center gap-1.5"
            >
              <IconTranslate size={13} /> Translate
            </button>
          )}
          {state === "loading" && (
            <span className="text-[12px] text-ink/65 inline-flex items-center gap-1.5">
              <IconLoader size={13} /> Translating...
            </span>
          )}
          {t && (
            <button onClick={() => onTranslate(book)} className="text-[11.5px] text-ink/60 hover:text-ink transition">
              Retry
            </button>
          )}
        </div>

        {!t && state !== "loading" && state !== "error" && (
          <div className="text-[12.5px] text-ink/70 leading-relaxed">
            This title appears to be in a non-Latin script. Translate to see romanized and English versions.
          </div>
        )}
        {state === "error" && (
          <div className="text-[12.5px] text-crimson flex items-center gap-1.5">
            <IconAlert size={13} /> Translation failed: {book._translateError || "Tap Retry."}
          </div>
        )}
        {t && (
          <div className="mt-1">
            <TranslateField label="English Translation" value={t.english} />
          </div>
        )}
      </div>
    </div>
  );
}

function TranslateField({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink/55 mb-0.5">{label}</div>
      <div className={`text-[13px] text-ink ${mono ? "font-mono" : ""}`}>{value || "-"}</div>
    </div>
  );
}
