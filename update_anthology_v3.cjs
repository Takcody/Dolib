const fs = require('fs');
let code = fs.readFileSync('src/components/BookForm.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-3 items-end">[\s\S]*?<div className="flex items-center h-9 justify-start pl-2">/g;

const replacement = `<div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center h-9 justify-start pl-2 mt-[22px]">`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/BookForm.tsx', code);
console.log('Fixed Anthology checkbox vertical alignment.');