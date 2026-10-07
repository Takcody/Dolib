const fs = require('fs');

const path = 'src/components/BookForm.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="flex items-center space-x-2 h-9 justify-center pt-5">[\s\S]*?<\/Label>\s*<\/div>/;

const replacement = `<div className="flex items-center h-9 justify-start pl-2">
            <Checkbox
              id="anthology"
              checked={isAnthology}
              onCheckedChange={(c) => setIsAnthology(!!c)}
              className="mr-2"
            />
            <Label htmlFor="anthology" className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">
              {t('anthology', 'Anthology')}
            </Label>
          </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code);
console.log('Fixed Anthology checkbox placement.');
