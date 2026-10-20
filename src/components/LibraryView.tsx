import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Book } from '@/lib/db';
import { triggerFilePickerIntent } from '@/lib/pickerState';
import { BookCard } from './BookCard';
import { BookForm } from './BookForm';
import { CameraCapture } from './CameraCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Download,
  Upload,
  Library as LibraryIcon,
  Settings as SettingsIcon,
  X,
  SortAsc,
  Calendar,
  Copy,
  Languages,
  ImageIcon,
  Camera,
  Trash2,
  FolderOpen,
  Users,
  Shield,
  KeyRound,
  FileJson,
  FileSpreadsheet,
  ScanLine,
  BarChart2,
  BookOpen,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Pause,
  Heart,
  ExternalLink,
  FileText,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export function LibraryView() {
  const { t, i18n } = useTranslation();
  const books = useLiveQuery(() => db.books.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('main'));

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date' | 'alpha' | 'duplicates' | 'author' | 'parody'>('date');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [showBgCamera, setShowBgCamera] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Paginated QR State
  const [qrPageIndex, setQrPageIndex] = useState(0);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [isQrAutoPlay, setIsQrAutoPlay] = useState(false);

  // Ref map to accumulate multi-part QR chunks during scan import
  const scannedChunksRef = useRef<Record<number, any[]>>({});

  // Background state
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [bgDim, setBgDim] = useState<number>(30);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedBg = localStorage.getItem('customBackground');
    const savedDim = localStorage.getItem('backgroundDim');
    if (savedBg) setCustomBg(savedBg);
    if (savedDim) setBgDim(parseInt(savedDim, 10));
  }, []);

  const handleSetBackground = (bgData: string | null) => {
    if (bgData) {
      setCustomBg(bgData);
      localStorage.setItem('customBackground', bgData);
    } else {
      setCustomBg(null);
      localStorage.removeItem('customBackground');
    }
  };

  const handleSetDim = (dim: number) => {
    setBgDim(dim);
    localStorage.setItem('backgroundDim', dim.toString());
  };

  const getAutoLockLabel = (time?: number) => {
    if (time === 0) return t('auto_lock_never', 'Never');
    if (time === 60000) return t('auto_lock_1m', '1 minute');
    if (time === 120000) return t('auto_lock_2m', '2 minutes');
    if (time === 300000) return t('auto_lock_5m', '5 minutes');
    if (time === 600000) return t('auto_lock_10m', '10 minutes');
    if (time === 1800000) return t('auto_lock_30m', '30 minutes');
    return t('auto_lock_minimize', 'Immediately upon minimize');
  };

  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const handleUpdatePasscode = async () => {
    if (!newPasscode && !confirmPasscode) {
      await db.settings.update('main', { passcode: undefined });
      toast.success(t('passcode_removed', 'Passcode lock removed'));
      return;
    }

    if (newPasscode !== confirmPasscode) {
      toast.error(t('passcodes_dont_match', "Passcodes don't match"));
      return;
    }

    if (newPasscode.length !== 6) {
      toast.error(t('passcode_6_digits', 'Passcode must be 6 digits'));
      return;
    }

    await db.settings.update('main', { passcode: newPasscode });
    toast.success(t('passcode_updated', 'Passcode updated successfully!'));
    setNewPasscode('');
    setConfirmPasscode('');
  };

  const handleBackgroundFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSetBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Library Statistics Calculation
  const stats = useMemo(() => {
    const total = books.length;
    const authors = new Set(books.map((b) => b.author?.trim()).filter(Boolean)).size;
    const circles = new Set(books.map((b) => b.circle?.trim()).filter(Boolean)).size;
    const parodies = new Set(books.map((b) => b.parody?.trim()).filter(Boolean)).size;
    const anthologies = books.filter((b) => b.isAnthology).length;
    const covers = books.filter((b) => b.coverImage).length;
    const barcodes = books.filter((b) => b.barcode).length;

    const sizeCounts: Record<string, number> = {
      B5: 0,
      A5: 0,
      A4: 0,
      B6: 0,
      A6: 0,
      Square: 0,
      Other: 0,
    };

    books.forEach((b) => {
      const sz = b.size || 'B5';
      sizeCounts[sz] = (sizeCounts[sz] || 0) + 1;
    });

    return {
      total,
      authors,
      circles,
      parodies,
      anthologies,
      covers,
      barcodes,
      sizeCounts,
    };
  }, [books]);

  // Paginated QR Chunks for Large Libraries (15 books per chunk for crisp, low-density scanning)
  const qrChunks = useMemo(() => {
    if (!books || books.length === 0) return [];

    const itemsPerPage = 15;
    const totalPages = Math.ceil(books.length / itemsPerPage);
    const chunks: { page: number; total: number; payload: string }[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageBooks = books.slice(i * itemsPerPage, (i + 1) * itemsPerPage).map((b) => ({
        t: b.title,
        tr: b.translatedTitle || '',
        a: b.author || '',
        c: b.circle || '',
        p: b.parody || '',
        s: b.size || 'B5',
        b: b.barcode || '',
      }));

      const chunkData = {
        p: i + 1,
        t: totalPages,
        b: pageBooks,
      };

      chunks.push({
        page: i + 1,
        total: totalPages,
        payload: JSON.stringify(chunkData),
      });
    }

    return chunks;
  }, [books]);

  // Auto-play QR slideshow timer in zoom mode
  useEffect(() => {
    if (!isQrAutoPlay || !isQrZoomed || qrChunks.length <= 1) return;
    const interval = setInterval(() => {
      setQrPageIndex((prev) => (prev + 1) % qrChunks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isQrAutoPlay, isQrZoomed, qrChunks.length]);

  // Detect duplicate groups
  const duplicateGroupIds = useMemo(() => {
    const titleAuthorMap = new Map<string, string[]>();
    books.forEach((book) => {
      const key = `${book.title.trim().toLowerCase()}|${(book.author || '').trim().toLowerCase()}`;
      if (!titleAuthorMap.has(key)) {
        titleAuthorMap.set(key, []);
      }
      titleAuthorMap.get(key)!.push(book.id!.toString());
    });

    const duplicateIds = new Set<string>();
    titleAuthorMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicateIds.add(id));
      }
    });

    return duplicateIds;
  }, [books]);

  // Filter & Sort
  const filteredBooks = useMemo(() => {
    let result = books.filter((book) => {
      const q = search.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        (book.translatedTitle && book.translatedTitle.toLowerCase().includes(q)) ||
        (book.author && book.author.toLowerCase().includes(q)) ||
        (book.circle && book.circle.toLowerCase().includes(q)) ||
        (book.parody && book.parody.toLowerCase().includes(q)) ||
        (book.barcode && book.barcode.toLowerCase().includes(q))
      );
    });

    if (sort === 'date') {
      result.sort((a, b) => b.addedAt - a.addedAt);
    } else if (sort === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'author') {
      result.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sort === 'parody') {
      result.sort((a, b) => (a.parody || '').localeCompare(b.parody || ''));
    } else if (sort === 'duplicates') {
      result = result.filter((book) => duplicateGroupIds.has(book.id!.toString()));
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [books, search, sort, duplicateGroupIds]);

  const handleExportCompact = () => {
    const compactBooks = books.map(({ id, coverImage, ...rest }) => rest);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(compactBooks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dolib-compact-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(t('export_success', 'Compact backup downloaded!'));
  };

  const handleExportFull = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dolib-full-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(t('export_success', 'Full backup downloaded!'));
  };

  const importBooksList = async (importedBooks: any[]) => {
    let count = 0;
    for (const b of importedBooks) {
      if (b.title) {
        await db.books.add({
          title: b.title,
          translatedTitle: b.tr || b.translatedTitle || undefined,
          author: b.a || b.author || undefined,
          circle: b.c || b.circle || undefined,
          barcode: b.b || b.barcode || undefined,
          parody: b.p || b.parody || undefined,
          size: b.s || b.size || 'B5',
          isAnthology: b.isAnthology || false,
          coverImage: b.coverImage || undefined,
          addedAt: Date.now(),
        });
        count++;
      }
    }
    toast.success(`Successfully imported ${count} books!`);
    setIsImportOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            await importBooksList(imported);
          } else {
            toast.error(t('import_invalid_format', 'Invalid JSON file format'));
          }
        } catch (err) {
          toast.error(t('import_error', 'Error reading JSON file'));
        }
      };
    }
  };

  const handleQrImport = (scannedData: string) => {
    try {
      const parsed = JSON.parse(scannedData);

      if (parsed.p && parsed.t && Array.isArray(parsed.b)) {
        // Multi-part paginated chunk
        scannedChunksRef.current[parsed.p] = parsed.b;
        const collectedCount = Object.keys(scannedChunksRef.current).length;

        if (collectedCount < parsed.t) {
          toast.info(`Scanned Page ${parsed.p} of ${parsed.t}. Scan remaining pages to complete import!`);
          return;
        }

        // All chunks collected!
        let allBooks: any[] = [];
        for (let p = 1; p <= parsed.t; p++) {
          if (scannedChunksRef.current[p]) {
            allBooks.push(...scannedChunksRef.current[p]);
          }
        }
        scannedChunksRef.current = {}; // Reset map
        importBooksList(allBooks);
      } else if (Array.isArray(parsed)) {
        importBooksList(parsed);
      } else {
        toast.error(t('import_invalid_format', 'Invalid QR code data'));
      }
    } catch (e) {
      toast.error(t('import_error', 'Error parsing QR code'));
    }
  };

  const handleDeleteAll = async () => {
    if (confirm(t('delete_all_confirm', 'Are you sure you want to delete all data? This cannot be undone.'))) {
      await db.books.clear();
      toast.success(t('delete_all_success', 'All data cleared'));
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="relative min-h-svh bg-background overflow-x-hidden">
      {/* Custom Background Image Layer */}
      {customBg && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300 pointer-events-none"
          style={{ backgroundImage: `url(${customBg})` }}
        >
          <div
            className="absolute inset-0 bg-background transition-opacity duration-300"
            style={{ opacity: bgDim / 100 }}
          />
        </div>
      )}

      <div className="relative z-1 flex flex-col min-h-svh">
        {/* Header with corrected icons and safe area insets */}
        <header className={cn(
          "px-4 pb-3 flex items-center justify-between sticky top-0 z-10 transition-colors pt-[max(1rem,env(safe-area-inset-top))]",
          customBg ? "bg-card/85 backdrop-blur-md" : "bg-card"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-xs ring-1 ring-border/50 bg-background">
              <img
                src="/icon.png"
                alt="Logo"
                className="w-full h-full object-cover select-none transition-transform duration-200 hover:scale-105"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t('app_name')}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Library Statistics Icon */}
            <Button variant="ghost" size="icon" onClick={() => setIsStatsOpen(true)} title={t('library_stats', 'Library Statistics')}>
              <BarChart2 className="w-5 h-5 text-foreground" />
            </Button>
            {/* Settings Icon */}
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} title={t('settings')}>
              <SettingsIcon className="w-5 h-5" />
            </Button>
            {/* Import Icon */}
            <Button variant="ghost" size="icon" onClick={() => setIsImportOpen(true)} title={t('import_library')}>
              <Download className="w-5 h-5" />
            </Button>
            {/* Export Icon */}
            <Button variant="ghost" size="icon" onClick={() => setIsExportOpen(true)} title={t('export_library')}>
              <Upload className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Search & Sort Bar */}
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('search_placeholder')}
                className={cn(
                  "pl-10 h-11 border-none focus-visible:ring-1",
                  customBg ? "bg-background/80 backdrop-blur-md" : "bg-muted/50"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger className={cn(
                "w-[130px] h-11 border-none font-medium text-xs",
                customBg ? "bg-background/80 backdrop-blur-md" : "bg-muted/50"
              )}>
                <SelectValue placeholder={t('sort_by')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t('sort_date')}</SelectItem>
                <SelectItem value="alpha">{t('sort_alpha')}</SelectItem>
                <SelectItem value="author">{t('sort_author', 'Author')}</SelectItem>
                <SelectItem value="parody">{t('sort_parody', 'Parody / Category')}</SelectItem>
                <SelectItem value="duplicates">
                  <span className="flex items-center gap-1.5 text-destructive font-medium">
                    <Copy className="w-3.5 h-3.5" />
                    {t('sort_duplicates')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Duplicates Filter Banner */}
          {sort === 'duplicates' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 shrink-0" />
                <span>Showing {filteredBooks.length} potential duplicate entries</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                onClick={() => setSort('date')}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Book Grid / List View */}
        <div className="flex-1 p-4 pt-0">
          {filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-xs ring-1 ring-border/50 bg-background">
                <img
                  src="/icon.png"
                  alt="Logo"
                  className="w-full h-full object-cover select-none"
                />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="font-semibold text-lg">{t('no_books')}</h3>
                <p className="text-xs text-muted-foreground">{t('no_books_desc')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isDuplicate={duplicateGroupIds.has(book.id!.toString())}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed z-20"
          style={{
            bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))',
            right: 'max(1.5rem, calc(env(safe-area-inset-right, 0px) + 1.25rem))',
          }}
        >
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-7 h-7" />
          </Button>
        </motion.div>

        {/* Add Book Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>{t('add_book')}</DialogTitle>
            </DialogHeader>
            <BookForm onClose={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Edit Book Dialog */}
        <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle>{t('edit_book')}</DialogTitle>
            </DialogHeader>
            {selectedBook && (
              <BookForm book={selectedBook} onClose={() => setSelectedBook(null)} />
            )}
          </DialogContent>
        </Dialog>

        {/* Library Statistics Modal */}
        <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="w-5 h-5 text-primary" />
                <span>{t('library_stats', 'Library Statistics')}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Metric Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stats.total}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">{t('total_books', 'Total Books')}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/50 border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stats.authors}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">{t('unique_authors', 'Unique Artists')}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/50 border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stats.circles}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">{t('unique_circles', 'Unique Circles')}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-accent/50 border border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight">{stats.parodies}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">{t('unique_parodies', 'Unique Categories')}</div>
                  </div>
                </div>
              </div>

              {/* Book Size Distribution */}
              <div className="space-y-2.5 p-4 rounded-xl bg-muted/40 border border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('size_distribution', 'Book Size Distribution')}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(stats.sizeCounts).map(([sz, cnt]) => (
                    <div key={sz} className="flex justify-between items-center p-2 rounded-lg bg-background border border-border/60">
                      <span className="font-semibold font-mono text-muted-foreground">{sz}</span>
                      <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection Details */}
              <div className="space-y-2 p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t('collection_details', 'Collection Details')}
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('books_with_covers', 'Covers Saved')}</span>
                  <span className="font-bold">{stats.covers} / {stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('anthologies_count', 'Anthologies')}</span>
                  <span className="font-bold">{stats.anthologies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Barcodes Registered</span>
                  <span className="font-bold">{stats.barcodes}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('settings')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Appearance Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('appearance')}</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">{t('dark_mode')}</Label>
                  <Switch
                    id="dark-mode"
                    checked={settings?.isDarkMode ?? true}
                    onCheckedChange={(checked) => db.settings.update('main', { isDarkMode: checked })}
                  />
                </div>

                {/* Custom Background Image Setting */}
                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium flex items-center justify-between">
                    <span>Custom Wallpaper Background</span>
                    {customBg && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => handleSetBackground(null)}
                      >
                        Reset
                      </Button>
                    )}
                  </Label>

                  {customBg ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border bg-cover bg-center" style={{ backgroundImage: `url(${customBg})` }}>
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-black/60 text-white hover:bg-black/80"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Change Wallpaper</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs gap-1.5"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        <span>Gallery / GIF</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs gap-1.5"
                        onClick={() => setShowBgCamera(true)}
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        <span>{t('take_photo')}</span>
                      </Button>
                    </div>
                  )}

                  {/* Hidden File Inputs */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*,.gif"
                    className="hidden"
                    onClick={triggerFilePickerIntent}
                    onChange={handleBackgroundFileInput}
                  />
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onClick={triggerFilePickerIntent}
                    onChange={handleBackgroundFileInput}
                  />

                  {/* Background Dim Slider */}
                  {customBg && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Background Dim</span>
                        <span className="font-mono text-muted-foreground">{bgDim}%</span>
                      </div>
                      <Slider
                        value={[bgDim]}
                        onValueChange={(vals) => handleSetDim(vals[0])}
                        min={0}
                        max={90}
                        step={5}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <Label htmlFor="language" className="text-sm font-medium">{t('language')}</Label>
                  <Select
                    value={settings?.language || 'en'}
                    onValueChange={(val) => db.settings.update('main', { language: val })}
                  >
                    <SelectTrigger id="language" className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('security')}</h4>

                <div className="space-y-3">
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('passcode_lock', 'Passcode Lock')}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                    className="h-10 text-sm"
                  />

                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('confirm_passcode', 'Confirm new passcode')}
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                    className="h-10 text-sm"
                  />

                  <Button
                    variant="secondary"
                    className="w-full h-10 font-semibold text-sm bg-secondary hover:bg-secondary/80 text-foreground"
                    onClick={handleUpdatePasscode}
                  >
                    {t('update_passcode_lock', 'Update Passcode Lock')}
                  </Button>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <Label htmlFor="auto-lock" className="text-sm font-semibold">{t('auto_lock', 'Auto-Lock Library')}</Label>
                  <Select
                    value={(settings?.autoLockTime ?? -1).toString()}
                    onValueChange={(v) => db.settings.update('main', { autoLockTime: parseInt(v, 10) })}
                  >
                    <SelectTrigger id="auto-lock" className="w-full h-11 text-sm font-medium">
                      <SelectValue>{getAutoLockLabel(settings?.autoLockTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('auto_lock_never', 'Never')}</SelectItem>
                      <SelectItem value="-1">{t('auto_lock_minimize', 'Immediately upon minimize')}</SelectItem>
                      <SelectItem value="60000">{t('auto_lock_1m', '1 minute')}</SelectItem>
                      <SelectItem value="120000">{t('auto_lock_2m', '2 minutes')}</SelectItem>
                      <SelectItem value="300000">{t('auto_lock_5m', '5 minutes')}</SelectItem>
                      <SelectItem value="600000">{t('auto_lock_10m', '10 minutes')}</SelectItem>
                      <SelectItem value="1800000">{t('auto_lock_30m', '30 minutes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data Management Section */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('data_management')}</h4>

                <Button
                  variant="destructive"
                  className="w-full justify-start h-10 gap-2 font-normal"
                  onClick={handleDeleteAll}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('delete_all')}</span>
                </Button>
              </div>

              {/* About Section */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('about', 'About')}
                </h4>

                <div className="p-3.5 bg-muted/30 rounded-2xl border border-dashed border-border space-y-3 text-xs leading-relaxed">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 rounded-xl bg-background border overflow-hidden shrink-0 shadow-xs">
                      <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground italic leading-tight">
                        {t('about_desc', "This app was vibe-coded. Let me know if you find a bug from the app store's contact publisher form~")}
                      </p>
                      <div className="text-[11px] text-muted-foreground/80 font-medium">
                        <div>{t('prompter', 'Prompter: Takcody')}</div>
                        <div>{t('created_with', 'Created using Google AI Studio and Gemini')}</div>
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-9 text-xs gap-2 font-medium bg-background hover:bg-muted"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span>{t('freeware_title', 'Freeware License & Privacy Policy')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          {t('freeware_title', 'Freeware License & Privacy Policy')}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed py-1">
                        <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            {t('freeware_license', 'Freeware License')}
                          </h4>
                          <p>{t('freeware_desc', 'Dolib is free software provided "as-is" without warranty of any kind.')}</p>
                        </section>

                        <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                            {t('privacy_policy', 'Privacy & Offline Policy')}
                          </h4>
                          <ul className="list-disc pl-3.5 space-y-1 mt-1 text-[11px]">
                            <li>{t('privacy_point_1', '100% Local Storage: All data stays on your device.')}</li>
                            <li>{t('privacy_point_2', 'No tracking or analytics.')}</li>
                            <li>{t('privacy_point_3', 'Complete offline capabilities.')}</li>
                            <li>{t('privacy_point_4', 'Complete user data control.')}</li>
                          </ul>
                        </section>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Support Me Section */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('support_me', 'Support Me')}
                </h4>

                <div className="p-3.5 bg-muted/30 rounded-2xl border border-dashed border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground">Ko-fi</div>
                      <div className="text-[11px] text-muted-foreground truncate font-mono">
                        https://ko-fi.com/takcody
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3.5 text-xs gap-1.5 font-medium shrink-0 bg-background"
                    onClick={() => window.open('https://ko-fi.com/takcody', '_blank')}
                  >
                    <span>Ko-fi</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog with Paginated QR Chunks */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('export_library')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('export_mode_desc')}
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <Button variant="outline" className="h-auto p-3 flex items-start gap-3 text-left justify-start" onClick={handleExportCompact}>
                  <FileJson className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-xs">{t('export_compact_title')}</div>
                    <div className="text-[11px] text-muted-foreground font-normal">{t('export_compact_desc')}</div>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto p-3 flex items-start gap-3 text-left justify-start" onClick={handleExportFull}>
                  <FileSpreadsheet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-xs">{t('export_full_title')}</div>
                    <div className="text-[11px] text-muted-foreground font-normal">{t('export_full_desc')}</div>
                  </div>
                </Button>
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-popover px-2 text-muted-foreground">{t('qr_share_label')}</span>
                </div>
              </div>

              {/* Paginated QR Code Display */}
              {qrChunks.length > 0 && (
                <div className="flex flex-col items-center gap-3 pt-1">
                  <div
                    onClick={() => setIsQrZoomed(true)}
                    className="p-3.5 bg-white rounded-2xl shadow-md border cursor-pointer group hover:ring-2 hover:ring-primary transition-all relative"
                    title={t('qr_tap_zoom', 'Tap QR code to enlarge')}
                  >
                    <QRCodeSVG
                      value={qrChunks[qrPageIndex]?.payload || ''}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded-md p-1 backdrop-blur-xs opacity-80 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {qrChunks.length > 1 && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => setQrPageIndex((prev) => (prev - 1 + qrChunks.length) % qrChunks.length)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <span className="text-xs font-semibold font-mono text-muted-foreground">
                        {t('qr_page_indicator', { current: qrPageIndex + 1, total: qrChunks.length })}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => setQrPageIndex((prev) => (prev + 1) % qrChunks.length)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-[10px] text-center text-muted-foreground max-w-[240px]">
                    {t('qr_tap_zoom', 'Tap QR code to enlarge for easy scanning')}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Screen Enlarge QR Zoom Dialog */}
        <Dialog open={isQrZoomed} onOpenChange={setIsQrZoomed}>
          <DialogContent className="max-w-md p-6 bg-black/95 text-white border-none z-[100] flex flex-col items-center justify-between min-h-[80vh]">
            <DialogHeader className="w-full flex flex-row items-center justify-between">
              <DialogTitle className="text-sm font-semibold tracking-wide text-white/90">
                {t('export_library')} — {t('qr_page_indicator', { current: qrPageIndex + 1, total: qrChunks.length })}
              </DialogTitle>
            </DialogHeader>

            {/* High Contrast Zoomed QR Code */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 my-auto py-4">
              <div
                className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-white/20 cursor-pointer"
                onClick={() => {
                  if (qrChunks.length > 1) {
                    setQrPageIndex((prev) => (prev + 1) % qrChunks.length);
                  }
                }}
              >
                <QRCodeSVG
                  value={qrChunks[qrPageIndex]?.payload || ''}
                  size={260}
                  level="L"
                  includeMargin={false}
                />
              </div>

              {qrChunks.length > 1 && (
                <div className="flex items-center gap-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white border-none"
                    onClick={() => setQrPageIndex((prev) => (prev - 1 + qrChunks.length) % qrChunks.length)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <Button
                    variant={isQrAutoPlay ? 'default' : 'secondary'}
                    size="sm"
                    className={cn(
                      "rounded-full h-9 px-4 text-xs gap-1.5 transition-colors border-none",
                      isQrAutoPlay ? "bg-amber-400 text-black font-semibold" : "bg-white/20 text-white"
                    )}
                    onClick={() => setIsQrAutoPlay(!isQrAutoPlay)}
                  >
                    {isQrAutoPlay ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{t('qr_auto_play', 'Auto-Play 3s')}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white border-none"
                    onClick={() => setQrPageIndex((prev) => (prev + 1) % qrChunks.length)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-white/70 text-center max-w-xs">
              {qrChunks.length > 1
                ? "Hold scanning phone over screen. Auto-plays through pages sequentially!"
                : "Hold scanning camera over screen to transfer library."}
            </p>
          </DialogContent>
        </Dialog>

        {/* Import Dialog with Dedicated QR Scanner & File Upload */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('import_library')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t('import_new_desc')}
              </p>

              <Button
                variant="default"
                className="w-full h-11 gap-2"
                onClick={() => {
                  setIsImportOpen(false);
                  setShowQrScanner(true);
                }}
              >
                <ScanLine className="w-4 h-4" />
                <span>{t('scan_qr_import')}</span>
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-popover px-2 text-muted-foreground">{t('or_upload_file')}</span>
                </div>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="w-7 h-7 mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-semibold">{t('click_to_upload')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('json_only')}</p>
                  </div>
                  <input type="file" className="hidden" accept=".json" onClick={triggerFilePickerIntent} onChange={handleImport} />
                </label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Background Camera Capture Modal */}
      <AnimatePresence>
        {showBgCamera && (
          <CameraCapture
            mode="photo"
            allowModeSwitch={false}
            onCapture={(img) => {
              handleSetBackground(img);
              setShowBgCamera(false);
            }}
            onClose={() => setShowBgCamera(false)}
          />
        )}
      </AnimatePresence>

      {/* Import QR Code Camera Scanner Modal (Locked to Scanner Mode) */}
      <AnimatePresence>
        {showQrScanner && (
          <CameraCapture
            mode="scan"
            allowModeSwitch={false}
            onScan={(data) => {
              handleQrImport(data);
              setShowQrScanner(false);
            }}
            onClose={() => setShowQrScanner(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
