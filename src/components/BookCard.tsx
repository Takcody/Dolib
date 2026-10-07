import React from 'react';
import { Book } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface BookCardProps {
  book: Book;
  isDuplicate?: boolean;
  onClick: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, isDuplicate, onClick }) => {
  const { t } = useTranslation();
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group",
        isDuplicate && "ring-1 ring-destructive/30 bg-destructive/5"
      )}
      onClick={onClick}
    >
      <div className="aspect-[3/4] relative bg-muted flex items-center justify-center overflow-hidden">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {book.parody && (
            <Badge className="bg-background/80 text-foreground backdrop-blur-sm border-none">
              {book.parody}
            </Badge>
          )}
          {isDuplicate && (
            <Badge variant="destructive" className="shadow-sm">
              {t('sort_duplicates')}
            </Badge>
          )}
        </div>
        {book.size && (
          <Badge variant="outline" className="absolute bottom-2 left-2 bg-background/50 text-[10px] backdrop-blur-sm border-none h-5 px-1.5">
            {book.size}
          </Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-1">
        <div>
          <h3 className="font-bold text-sm line-clamp-1 leading-tight">{book.title}</h3>
          {book.translatedTitle && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 italic font-normal">
              {book.translatedTitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="w-3 h-3 shrink-0" />
          <span className="line-clamp-1">
            {book.author?.trim() || (book.isAnthology ? t('anthology', 'Anthology') : '—')}
          </span>
        </div>
        {book.barcode && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
            <Hash className="w-2.5 h-2.5" />
            <span>{book.barcode}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
