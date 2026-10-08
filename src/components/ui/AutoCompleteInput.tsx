import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AutoCompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | string;
}

export function AutoCompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  autoCapitalize = 'none',
  id,
  required,
  ...props
}: AutoCompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!options || options.length === 0) return [];
    const trimmedVal = value.trim().toLowerCase();
    if (!trimmedVal) return options.slice(0, 10); // Show top suggestions when empty

    return options
      .filter((opt) => opt.toLowerCase().includes(trimmedVal) && opt.toLowerCase() !== trimmedVal)
      .slice(0, 8);
  }, [options, value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('h-9 text-sm', className)}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        required={required}
        {...props}
      />

      {/* Custom Styled Suggestion Popup */}
      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 max-h-40 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md"
          >
            <div className="p-1 space-y-0.5">
              {filteredOptions.map((opt, index) => (
                <button
                  key={`${opt}-${index}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between cursor-pointer select-none',
                    highlightedIndex === index
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-accent/50 text-foreground'
                  )}
                >
                  <span className="truncate">{opt}</span>
                  <span className="text-[10px] text-muted-foreground opacity-60 ml-2 shrink-0">
                    Auto-fill
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
