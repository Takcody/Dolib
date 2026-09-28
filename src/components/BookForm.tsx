import React, { useState, useRef } from 'react';
import { Book, db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, BookOpen, Save, Trash2, Scan, Copy, FolderOpen } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface BookFormProps {
  book?: Book;
  onClose: () => void;
}

export function BookForm({ book, onClose }: BookFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [barcode, setBarcode] = useState(book?.barcode || '');
  const [parody, setParody] = useState(book?.parody || '');
  const [size, setSize] = useState(book?.size || 'A4');
  const [coverImage, setCoverImage] = useState(book?.coverImage || '');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'scan'>('photo');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
            setCoverImage(compressed);
            toast.success(t('cover_image_updated', { defaultValue: 'Cover image updated' }));
            return;
          }
        }
        setCoverImage(src);
        toast.success(t('cover_image_updated', { defaultValue: 'Cover image updated' }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!title || !author) {
      toast.error(t('title') + ' & ' + t('author') + ' are required');
      return;
    }

    // Check for duplicates if not editing an existing book or if title/author changed
    if (!book?.id || (book.title !== title || book.author !== author)) {
      if (!force) {
        const existing = await db.books
          .where({ title })
          .and(b => b.author === author)
          .first();
        
        if (existing) {
          setShowDuplicateWarning(true);
          return;
        }
      }
    }

    const bookData: Book = {
      title,
      author,
      barcode,
      parody,
      size,
      coverImage,
      addedAt: book?.addedAt || Date.now(),
    };

    try {
      if (book?.id) {
        await db.books.update(book.id, bookData);
        toast.success(t('update') + ' successful');
      } else {
        await db.books.add(bookData);
        toast.success(t('add_book') + ' successful');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t('save') + ' failed');
    }
  };

  const handleDelete = async () => {
    if (book?.id) {
      if (!isDeleting) {
        setIsDeleting(true);
        toast.info(t('delete') + ' again to confirm');
        return;
      }
      await db.books.delete(book.id);
      toast.success(t('delete') + ' successful');
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative w-32 h-44 bg-muted rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center group shadow-xs hover:border-primary/50 transition-colors">
          {coverImage ? (
            <>
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-destructive text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer z-10"
                title={t('delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('photo');
                  setShowCamera(true);
                }}
                className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer z-10"
                title={t('take_photo')}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div 
              className="flex flex-col items-center justify-center gap-2 p-2 text-center cursor-pointer select-none w-full h-full hover:bg-muted/60 transition-colors"
              onClick={() => {
                setCameraMode('photo');
                setShowCamera(true);
              }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs text-foreground font-medium">
                {t('take_photo')}
              </span>
            </div>
          )}
        </div>

        {/* Gallery Action Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 bg-background shadow-xs hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen className="w-3.5 h-3.5 text-primary" />
          <span>{t('choose_from_gallery')}</span>
        </Button>

        {/* Hidden File Input for Gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">{t('title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('title')}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="author" className="text-xs">{t('author')}</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t('author')}
              className="h-9 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="barcode" className="text-xs">{t('barcode')}</Label>
            <div className="flex gap-1.5">
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={t('optional')}
                className="flex-1 h-9 text-sm"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  setCameraMode('scan');
                  setShowCamera(true);
                }}
              >
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parody" className="text-xs">{t('parody')}</Label>
            <Input
              id="parody"
              value={parody}
              onChange={(e) => setParody(e.target.value)}
              placeholder={t('parody_placeholder')}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="size" className="text-xs">{t('size')}</Label>
          <Select value={size} onValueChange={setSize} modal={false}>
            <SelectTrigger id="size" className="h-9 text-sm">
              <SelectValue placeholder={t('size')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (Standard)</SelectItem>
              <SelectItem value="A5">A5 (Pocket)</SelectItem>
              <SelectItem value="B5">B5 (Composition)</SelectItem>
              <SelectItem value="Letter">Letter</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-2">
          {book?.id && (
            <Button type="button" variant="destructive" onClick={handleDelete} className="flex-1 h-10 text-sm">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          )}
          <Button type="submit" className="flex-1 h-10 text-sm">
            <Save className="w-4 h-4 mr-2" />
            {book?.id ? t('update') : t('add_book')}
          </Button>
        </div>

        {showDuplicateWarning && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-destructive/20 rounded-full">
                <Copy className="w-4 h-4 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">{t('duplicate_found')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('duplicate_msg')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8 text-xs"
                onClick={() => setShowDuplicateWarning(false)}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                className="flex-1 h-8 text-xs"
                onClick={(e) => handleSubmit(e as any, true)}
              >
                {t('add_anyway')}
              </Button>
            </div>
          </div>
        )}
      </form>

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            mode={cameraMode}
            onCapture={(img) => {
              setCoverImage(img);
              setShowCamera(false);
            }}
            onScan={(data) => {
              setBarcode(data);
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
