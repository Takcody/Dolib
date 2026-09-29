import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Book } from '@/lib/db';
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
  Wallpaper,
  Sun,
  Moon,
  ScanLine,
  FileJson,
  QrCode,
  FileSpreadsheet,
  Heart,
  ExternalLink,
  ShieldCheck,
  Lock,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'motion/react';
import { App as CapApp } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function LibraryView() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'alpha' | 'duplicates' | 'author' | 'parody'>('date');
  const [showBgCamera, setShowBgCamera] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [sliderDim, setSliderDim] = useState<number | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const books = useLiveQuery(() => db.books.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('main'));

  const customBg = settings?.customBackground;
  const bgDim = settings?.backgroundDim ?? 60;
  const effectiveDim = sliderDim !== null ? sliderDim : bgDim;

  useEffect(() => {
    if (settings) {
      setIsDarkMode(!!settings.isDarkMode);
      if (typeof settings.backgroundDim === 'number') {
        setSliderDim(settings.backgroundDim);
      }
    }
  }, [settings]);

  // System back button & gesture handling
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      if (selectedBook) {
        setSelectedBook(null);
      } else if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (isExportOpen) {
        setIsExportOpen(false);
      } else if (isImportOpen) {
        setIsImportOpen(false);
      } else if (isAddOpen) {
        setIsAddOpen(false);
      } else if (showBgCamera) {
        setShowBgCamera(false);
      } else if (showQrScanner) {
        setShowQrScanner(false);
      } else if (searchQuery) {
        setSearchQuery('');
      } else {
        CapApp.minimizeApp();
      }
    });

    return () => {
      backListener.then(handler => handler.remove());
    };
  }, [selectedBook, isSettingsOpen, isExportOpen, isImportOpen, isAddOpen, showBgCamera, showQrScanner, searchQuery]);

  const handleUpdatePasscode = async () => {
    if (newPasscode.length !== 6) {
      toast.error('Passcode must be 6 digits');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      toast.error('Passcodes do not match');
      return;
    }
    await db.settings.update('main', { passcode: newPasscode });
    toast.success('Passcode updated successfully');
    setNewPasscode('');
    setConfirmPasscode('');
  };

  const handleToggleDarkMode = async () => {
    const newMode = !isDarkMode;
    await db.settings.update('main', { isDarkMode: newMode });
    setIsDarkMode(newMode);
    toast.success(t('dark_mode') + ` ${newMode ? 'enabled' : 'disabled'}`);
  };

  const handleLanguageChange = async (lang: string) => {
    await db.settings.update('main', { language: lang });
    i18n.changeLanguage(lang);
    toast.success(t('language') + ' updated');
  };

  const handleBackgroundFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        await db.settings.update('main', { customBackground: result });
        toast.success(t('bg_updated'));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSetBackground = async (imageData: string) => {
    await db.settings.update('main', { customBackground: imageData });
    toast.success(t('bg_updated'));
  };

  const handleRemoveBackground = async () => {
    await db.settings.update('main', { customBackground: undefined });
    toast.success(t('bg_removed'));
  };

  const handleUpdateBgDim = async (dim: number) => {
    await db.settings.update('main', { backgroundDim: dim });
  };

  const { duplicateBarcodes, duplicateTitles } = useMemo(() => {
    const barcodeCounts = new Map<string, number>();
    const titleCounts = new Map<string, number>();

    books.forEach(b => {
      const code = b.barcode?.trim();
      if (code) {
        barcodeCounts.set(code, (barcodeCounts.get(code) || 0) + 1);
      }
      const titleKey = `${b.title.trim().toLowerCase()}|${b.author.trim().toLowerCase()}`;
      titleCounts.set(titleKey, (titleCounts.get(titleKey) || 0) + 1);
    });

    const dupBarcodes = new Set<string>();
    barcodeCounts.forEach((count, code) => {
      if (count > 1) dupBarcodes.add(code);
    });

    const dupTitles = new Set<string>();
    titleCounts.forEach((count, key) => {
      if (count > 1) dupTitles.add(key);
    });

    return { duplicateBarcodes: dupBarcodes, duplicateTitles: dupTitles };
  }, [books]);

  const isBookDuplicate = (book: Book) => {
    const code = book.barcode?.trim();
    if (code && duplicateBarcodes.has(code)) return true;
    const titleKey = `${book.title.trim().toLowerCase()}|${book.author.trim().toLowerCase()}`;
    if (duplicateTitles.has(titleKey)) return true;
    return false;
  };

  const filteredBooks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = books.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.barcode?.toLowerCase().includes(query) ||
      book.parody?.toLowerCase().includes(query)
    );

    if (sortBy === 'duplicates') {
      // ONLY show items which are duplicates (by barcode OR exact title & author)
      result = result.filter(isBookDuplicate);
      // Group duplicate items together
      result.sort((a, b) => {
        const codeA = a.barcode?.trim() || '';
        const codeB = b.barcode?.trim() || '';
        if (codeA && codeB && codeA !== codeB) return codeA.localeCompare(codeB);
        const nameA = `${a.title.toLowerCase()}|${a.author.toLowerCase()}`;
        const nameB = `${b.title.toLowerCase()}|${b.author.toLowerCase()}`;
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return b.addedAt - a.addedAt;
      });
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'parody') {
      result.sort((a, b) => (a.parody || '').localeCompare(b.parody || ''));
    } else {
      result.sort((a, b) => b.addedAt - a.addedAt);
    }
    
    return result;
  }, [books, searchQuery, sortBy, duplicateBarcodes, duplicateTitles]);

  // Save file to Documents and open Share sheet
  const saveAndShareJsonFile = async (filename: string, jsonContent: string, successMsg: string) => {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      toast.success(`${successMsg}! Saved to Documents/${filename}`, { duration: 5500 });

      if (result.uri) {
        try {
          await Share.share({
            title: filename,
            text: `Dolib Backup File: ${filename}`,
            url: result.uri,
            dialogTitle: 'Save or Share Backup File',
          });
        } catch {
          // Share sheet dismissed
        }
      }
    } catch (err) {
      console.warn('Native Filesystem save failed, using Web download fallback', err);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${successMsg} (Downloaded ${filename})`, { duration: 5500 });
    }
  };

  const handleExportCompact = () => {
    const compactData = books.map(({ coverImage, ...rest }) => rest);
    const filename = `dolib-compact-backup-${new Date().toISOString().split('T')[0]}.json`;
    saveAndShareJsonFile(filename, JSON.stringify(compactData, null, 2), 'Metadata backup exported');
  };

  const handleExportFull = () => {
    const filename = `dolib-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    saveAndShareJsonFile(filename, JSON.stringify(books, null, 2), 'Full library archive exported');
  };

  // Import handlers
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          let count = 0;
          for (const book of data) {
            const { id, ...bookWithoutId } = book;
            await db.books.add(bookWithoutId);
            count++;
          }
          toast.success(`Imported ${count} books`);
          setIsImportOpen(false);
        } else if (typeof data === 'object' && data !== null) {
          const { id, ...bookWithoutId } = data;
          await db.books.add(bookWithoutId);
          toast.success(`Imported 1 book`);
          setIsImportOpen(false);
        }
      } catch (err) {
        toast.error('Invalid export file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQrImport = async (scannedData: string) => {
    try {
      const parsed = JSON.parse(scannedData);
      if (Array.isArray(parsed)) {
        let count = 0;
        for (const item of parsed) {
          const title = item.title || item.t;
          const author = item.author || item.a;
          if (title) {
            await db.books.add({
              title,
              author: author || 'Unknown',
              addedAt: Date.now()
            });
            count++;
          }
        }
        if (count > 0) {
          toast.success(`Imported ${count} books from QR code`);
          setIsImportOpen(false);
        } else {
          toast.error('No valid books found in QR code');
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        const title = parsed.title || parsed.t;
        const author = parsed.author || parsed.a;
        if (title) {
          await db.books.add({
            title,
            author: author || 'Unknown',
            addedAt: Date.now()
          });
          toast.success(`Imported "${title}" from QR code`);
          setIsImportOpen(false);
        } else {
          toast.error('Invalid QR code format');
        }
      }
    } catch {
      toast.error('QR code does not contain valid book JSON data');
    }
  };

  return (
    <div 
      className={cn(
        "min-h-svh relative transition-all duration-300",
        customBg ? "bg-cover bg-center bg-fixed bg-no-repeat" : "bg-background"
      )}
      style={customBg ? { backgroundImage: `url(${customBg})` } : undefined}
    >
      {/* Background tint overlay */}
      {customBg && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-150"
          style={{
            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
            opacity: isDarkMode ? (effectiveDim / 100) : (effectiveDim * 0.35 / 100),
            backdropFilter: 'blur(1px)'
          }}
        />
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
          <div className="flex items-center gap-2">
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
                  customBg ? "bg-card/80 backdrop-blur-xs" : "bg-muted/50"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className={cn(
                "w-[130px] h-11 border-none",
                customBg ? "bg-card/80 backdrop-blur-xs" : "bg-muted/50"
              )}>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {sortBy === 'date' && <Calendar className="w-4 h-4" />}
                    {sortBy === 'alpha' && <SortAsc className="w-4 h-4" />}
                    {sortBy === 'duplicates' && <Copy className="w-4 h-4" />}
                    {sortBy === 'author' && <SortAsc className="w-4 h-4" />}
                    {sortBy === 'parody' && <FolderOpen className="w-4 h-4" />}
                    <span>
                      {sortBy === 'date' && t('sort_date')}
                      {sortBy === 'alpha' && t('sort_alpha')}
                      {sortBy === 'duplicates' && t('sort_duplicates')}
                      {sortBy === 'author' && t('sort_author', 'Author')}
                      {sortBy === 'parody' && t('sort_parody', 'Parody/Category')}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{t('sort_date')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="alpha">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    <span>{t('sort_alpha')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="author">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    <span>{t('sort_author', 'Author')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="parody">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{t('sort_parody', 'Parody')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="duplicates">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    <span>{t('sort_duplicates')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Book Grid */}
        <div className="px-4 pb-28 flex-1">
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-2">
              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  isDuplicate={isBookDuplicate(book)}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center p-8 opacity-75">
              <div className="w-24 h-24 bg-card/70 backdrop-blur-xs rounded-3xl flex items-center justify-center mb-6 overflow-hidden shadow-sm">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-lg font-medium">{t('no_books')}</p>
              <p className="text-sm text-muted-foreground">{t('no_books_desc')}</p>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-20 pb-[env(safe-area-inset-bottom)]">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('add_book')}</DialogTitle>
              </DialogHeader>
              <BookForm onClose={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Book Details Dialog */}
        <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('edit_book')}</DialogTitle>
            </DialogHeader>
            {selectedBook && (
              <BookForm
                book={selectedBook}
                onClose={() => setSelectedBook(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="sticky -top-4 -mx-4 px-4 pt-4 pb-2 bg-popover/95 backdrop-blur-xs z-10 border-b border-border/40">
              <DialogTitle>{t('settings')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-2 pb-3">
              

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('language')}</h3>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full h-12 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                    <SelectItem value="es">Español (Spanish)</SelectItem>
                    <SelectItem value="zh">中文 (Chinese)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                    <SelectItem value="de">Deutsch (German)</SelectItem>
                    <SelectItem value="ko">한국어 (Korean)</SelectItem>
                    <SelectItem value="pt">Português (Portuguese)</SelectItem>
                    <SelectItem value="it">Italiano (Italian)</SelectItem>
                    <SelectItem value="ru">Русский (Russian)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('appearance')}</h3>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <LibraryIcon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('dark_mode')}</p>
                      <p className="text-xs text-muted-foreground">{t('appearance')}</p>
                    </div>
                  </div>
                  <Button
                    variant={isDarkMode ? "default" : "outline"}
                    onClick={handleToggleDarkMode}
                  >
                    {isDarkMode ? t('on') : t('off')}
                  </Button>
                </div>

                {/* Custom Wallpaper / Background */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallpaper className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{t('custom_background')}</span>
                    </div>
                    {customBg && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive h-7 px-2"
                        onClick={handleRemoveBackground}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {t('remove_background')}
                      </Button>
                    )}
                  </div>

                  {customBg ? (
                    <div className="relative h-28 rounded-xl overflow-hidden border border-border group shadow-sm bg-muted">
                      <img src={customBg} alt="Background preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs rounded-lg shadow bg-background/90 hover:bg-background"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                          {t('choose_from_gallery')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs rounded-lg shadow bg-background/90 hover:bg-background"
                          onClick={() => setShowBgCamera(true)}
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5" />
                          {t('take_photo')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed bg-muted/20 flex flex-col items-center justify-center text-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Wallpaper className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{t('custom_background')}</p>
                        <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                          {t('custom_bg_desc')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-background hover:bg-muted"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-primary" />
                          <span>{t('choose_from_gallery')}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-background hover:bg-muted"
                          onClick={() => setShowBgCamera(true)}
                        >
                          <Camera className="w-3.5 h-3.5 text-primary" />
                          <span>{t('take_photo')}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Inputs */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*,.gif"
                    className="hidden"
                    onChange={handleBackgroundFileInput}
                  />
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleBackgroundFileInput}
                  />

                  {/* Background Dim Slider */}
                  {customBg && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">{t('bg_dim')}</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {effectiveDim}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="95"
                          step="1"
                          value={effectiveDim}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSliderDim(val);
                            handleUpdateBgDim(val);
                          }}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Moon className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('security')}</h3>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder={t('passcode_lock')}
                    maxLength={6}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                  />
                  <Input
                    type="password"
                    placeholder={t('confirm_passcode')}
                    maxLength={6}
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                  />
                  <Button className="w-full" onClick={handleUpdatePasscode}>
                    {t('update')} {t('passcode_lock')}
                  </Button>
                </div>

                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <p className="text-sm font-medium">{t('auto_lock', 'Auto-Lock Library')}</p>
                    <Select
                      value={settings?.autoLockTime?.toString() || '-1'}
                      onValueChange={(v) => {
                      db.settings.update('main', { autoLockTime: parseInt(v) });
                      toast.success(t('settings_updated', 'Settings updated!'));
                    }}
                    >
                      <SelectTrigger className="w-full h-11 bg-muted/30">
                        <SelectValue>
                          {settings?.autoLockTime === 0 && t('auto_lock_never', 'Never')}
                          {(settings?.autoLockTime === undefined || settings?.autoLockTime === -1) && t('auto_lock_minimize', 'Immediately upon minimize')}
                          {settings?.autoLockTime === 60000 && t('auto_lock_1m', '1 minute')}
                          {settings?.autoLockTime === 120000 && t('auto_lock_2m', '2 minutes')}
                          {settings?.autoLockTime === 300000 && t('auto_lock_5m', '5 minutes')}
                          {settings?.autoLockTime === 600000 && t('auto_lock_10m', '10 minutes')}
                          {settings?.autoLockTime === 1800000 && t('auto_lock_30m', '30 minutes')}
                        </SelectValue>
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

              <div className="pt-4 border-t space-y-2">
                <h3 className="text-sm font-medium">{t('about')}</h3>
                <div className="p-3 rounded-lg bg-muted/30 border border-dashed space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src="/icon.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs leading-relaxed text-muted-foreground italic">
                        {t('about_desc')}
                      </p>
                      <p className="text-[10px] mt-2 font-medium text-primary/70">
                        {t('prompter')}
                      </p>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {t('created_with')}
                      </p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 border-dashed">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span>{t('privacy_terms')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs sm:max-w-sm max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          {t('freeware_title')}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed py-1">
                        <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            {t('freeware_license')}
                          </h4>
                          <p>
                            {t('freeware_desc')}
                          </p>
                        </section>

                        <section className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                          <h4 className="font-semibold text-foreground text-xs mb-1 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                            {t('privacy_policy')}
                          </h4>
                          <ul className="list-disc pl-3.5 space-y-1 mt-1 text-[11px]">
                            <li>{t('privacy_point_1')}</li>
                            <li>{t('privacy_point_2')}</li>
                            <li>{t('privacy_point_3')}</li>
                            <li>{t('privacy_point_4')}</li>
                          </ul>
                        </section>
                      </div>
                      <DialogFooter showCloseButton />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="text-sm font-medium">{t('support_me')}</h3>
                <div className="p-3 rounded-lg bg-muted/30 border border-dashed flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 fill-rose-500/20" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Ko-fi</p>
                      <a
                        href="https://ko-fi.com/takcody"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline break-all block"
                      >
                        https://ko-fi.com/takcody
                      </a>
                    </div>
                  </div>
                  <a
                    href="https://ko-fi.com/takcody"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                      <span>Ko-fi</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('export_library')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('export_mode_desc')}
              </p>

              <div className="grid grid-cols-1 gap-3">
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

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-xs border">
                  <QRCodeSVG value={JSON.stringify(books.map(b => ({ t: b.title, a: b.author }))).slice(0, 2000)} size={180} />
                </div>
                <p className="text-[10px] text-center text-muted-foreground max-w-[220px]">
                  {t('qr_share_desc')}
                </p>
              </div>
            </div>
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
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
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
