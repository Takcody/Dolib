const fs = require('fs');
let code = fs.readFileSync('src/components/BookForm.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-3">[\s\S]*?<div className="flex items-center h-9 justify-start pl-2 mt-\[22px\]">/g;

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

          <div className="space-y-1.5">
            <Label className="text-xs opacity-0 hidden sm:block">Hidden</Label>
            <div className="flex items-center h-9 justify-start pl-2 mt-0 sm:mt-1.5">`;

code = code.replace(regex, replacement);

// We need to make sure the closing tag matches, the original code had:
//             <Checkbox id="anthology" ... />
//             <Label htmlFor="anthology" ...>{t('anthology', 'Anthology')}</Label>
//           </div>
// Since we added a `<div className="space-y-1.5">` wrapper, we need an extra `</div>` after the inner `</div>`.
code = code.replace(
  /<Label htmlFor="anthology" className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">\s*\{t\('anthology', 'Anthology'\)\}\s*<\/Label>\s*<\/div>/g,
  `<Label htmlFor="anthology" className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">
              {t('anthology', 'Anthology')}
            </Label>
          </div>
        </div>`
);

fs.writeFileSync('src/components/BookForm.tsx', code);
console.log('Fixed Anthology checkbox vertical alignment with ghost label.');