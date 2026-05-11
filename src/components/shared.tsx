"use client";
import React, { useState, useEffect, useRef } from 'react';
import { IconChevDown, IconShield, IconLogout, IconCheck, IconTrash, IconBook } from './icons';

export function Button({ variant = 'primary', accent = 'user', size = 'md', className = '', children, ...rest }: any){
  const accentBg = accent === 'admin' ? 'bg-admin' : 'bg-user';
  const accentText = accent === 'admin' ? 'text-admin' : 'text-user';
  const accentBorder = accent === 'admin' ? 'border-admin' : 'border-user';

  const sizes: any = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-[15px]',
  };

  let v = '';
  if (variant === 'primary'){
    v = `${accentBg} text-ink-invert hover:brightness-110`;
  } else if (variant === 'secondary'){
    v = `border ${accentBorder} ${accentText} bg-transparent hover:bg-secondary/20`;
  } else if (variant === 'ghost'){
    v = 'bg-transparent text-ink hover:bg-secondary/20';
  } else if (variant === 'destructive'){
    v = 'bg-crimson text-white hover:brightness-110 disabled:bg-crimson/40 disabled:cursor-not-allowed';
  } else if (variant === 'soft'){
    v = 'bg-surface text-ink hover:bg-secondary/40';
  }

  return (
    <button
      data-accent={accent}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background,color,box-shadow,filter,border-color] duration-200 ease-out cursor-pointer ${sizes[size]} ${v} ${className}`}
      {...rest}
    >{children}</button>
  );
}

export function Input({ accent = 'user', icon, className = '', wrapperClass = '', ...rest }: any){
  return (
    <div className={`relative ${wrapperClass}`} data-accent={accent}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/70">{icon}</span>
      )}
      <input
        className={`h-10 w-full rounded-lg bg-bg border border-ink/40 ${icon ? 'pl-9' : 'pl-3'} pr-3 text-sm text-ink placeholder-ink/50 focus:border-current transition-colors duration-200 ${accent === 'admin' ? 'focus:text-admin' : 'focus:text-user'} outline-none ${className}`}
        {...rest}
      />
    </div>
  );
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-md' }: any){
  useEffect(() => {
    if (!open) return;
    const onKey = (e: any) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className={`relative ${maxWidth} w-[92%] bg-surface rounded-2xl shadow-lift animate-modal-in p-6`}>
        {children}
      </div>
    </div>
  );
}

export function AvatarMenu({ user, onLogout, accent = 'user' }: any){
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const ringColor = accent === 'admin' ? 'ring-admin' : 'ring-user';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 group cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className={`h-9 w-9 rounded-full bg-secondary text-ink-invert grid place-items-center font-medium text-[13px] ring-2 ring-transparent group-hover:${ringColor} transition`}>
          {user.initials}
        </div>
        <IconChevDown size={16} className={`chev text-ink/70 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lift overflow-hidden animate-modal-in">
          <div className="px-4 py-3 border-b border-ink/15">
            <div className="text-sm font-semibold text-ink">{user.name}</div>
            <div className="text-xs text-ink/70 truncate">{user.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink/70">
              {user.role === 'admin'
                ? <><IconShield size={12}/> Administrator</>
                : <>Reader</>}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-secondary/30 flex items-center gap-2 transition cursor-pointer"
          >
            <IconLogout size={16}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function TopNav({ role, currentPath, user, onNavigate, onLogout }: any){
  const accent = role === 'admin' ? 'admin' : 'user';
  const accentUnderline = accent === 'admin' ? 'bg-admin' : 'bg-user';

  const NavLink = ({ href, label, active }: any) => (
    <button
      onClick={() => onNavigate(href)}
      className="relative px-1.5 h-16 text-[14px] font-medium tracking-tight transition-colors duration-200 cursor-pointer"
      data-accent={accent}
      style={{ color: active ? '#ffffff' : '#ffffff99' }}
      onMouseEnter={(e: any)=>{ if(!active) e.currentTarget.style.color = '#ffffff'; }}
      onMouseLeave={(e: any)=>{ if(!active) e.currentTarget.style.color = '#ffffff99'; }}
    >
      {label}
      {active && <span className={`absolute left-0 right-0 -bottom-px h-0.5 ${accentUnderline}`}/>}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur border-b border-ink/10" data-accent={accent}>
      <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/main_logo.svg" alt="Folio" className="h-9 w-9 filter invert opacity-90" />
          <span className="font-serif font-bold text-[20px] tracking-tight text-ink select-none">Folio</span>
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-[0.18em] text-ink/55 border-l border-ink/20 pl-3">
            {role === 'admin' ? 'Admin Console' : 'Library'}
          </span>
        </div>

        <nav className="flex items-center gap-7">
          {role === 'admin' ? (
            <>
              <NavLink href="/dashboard" label="Library" active={currentPath === '/dashboard'} />
              <NavLink href="/admin"     label="Admin"   active={currentPath === '/admin'} />
            </>
          ) : (
            <NavLink href="/dashboard"   label="Dashboard" active={currentPath === '/dashboard'} />
          )}
          <AvatarMenu user={user} onLogout={onLogout} accent={accent} />
        </nav>
      </div>
    </header>
  );
}

export function Toast({ toast }: any){
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white text-ink-invert text-sm px-4 py-2.5 rounded-lg shadow-lift animate-modal-in flex items-center gap-2">
      <IconCheck size={16}/> {toast}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: any){
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 className="font-serif text-[40px] leading-[1.05] font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink/75 max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function DeleteBookModal({ book, onClose, onConfirm, accent = 'user' }: any){
  const [typed, setTyped] = useState('');
  useEffect(() => { setTyped(''); }, [book?.id]);
  if (!book) return null;

  const armed = typed.trim().toUpperCase() === 'DELETE';

  return (
    <Modal open={!!book} onClose={onClose} maxWidth="max-w-[440px]">
      <div className="flex items-start gap-4">
        <div className="w-[68px] h-[100px] rounded-md overflow-hidden bg-ink/10 shrink-0 shadow-card relative">
          {book.cover ? (
            <img src={book.cover} alt="" className="w-full h-full object-cover"/>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/20 text-ink/40">
              <IconBook size={24}/>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-crimson font-medium mb-1">Permanent delete</div>
          <div className="font-serif text-[20px] text-ink leading-tight truncate-1">{book.title}</div>
          <div className="text-[12.5px] text-ink/70 mt-0.5">{book.author} · {book.subfolder}</div>
          <div className="mt-3 text-[13px] text-ink/85 leading-relaxed">
            This will remove the cover and metadata from storage and the library record. There is no undo.
          </div>
        </div>
      </div>

      <label className="block mt-5 text-[12px] uppercase tracking-wider text-ink/75 mb-1.5">
        Type <span className="font-mono text-ink">DELETE</span> to confirm
      </label>
      <Input
        value={typed}
        onChange={(e: any) => setTyped(e.target.value)}
        placeholder="DELETE"
        accent={accent}
        autoFocus
      />

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="destructive"
          disabled={!armed}
          onClick={() => onConfirm(book)}
        >
          <IconTrash size={15}/> Permanently Delete
        </Button>
      </div>
    </Modal>
  );
}
