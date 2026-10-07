const fs = require('fs');

const path = 'src/components/BookForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state for circle and isAnthology
code = code.replace(
  /const \[parody, setParody\] = useState\(book\?\.parody \|\| ''\);/g,
  `const [circle, setCircle] = useState(book?.circle || '');
  const [parody, setParody] = useState(book?.parody || '');
  const [isAnthology, setIsAnthology] = useState(book?.isAnthology || false);`
);

// 2. Add imports for Checkbox
if (!code.includes('@/components/ui/checkbox')) {
    code = code.replace(
        /import \{ Input \} from '@\/components\/ui\/input';/,
        `import { Input } from '@/components/ui/input';\nimport { Checkbox } from '@/components/ui/checkbox';`
    );
}

// 3. Update bookData payload
code = code.replace(
  /parody,\n      size,/g,
  `circle,\n      parody,\n      size,\n      isAnthology,`
);

// 4. Update the layout grids
// Instead of grid-cols-2 for author/title, we want to add circle.
// Let's make a grid for Title (full width)
// Then a grid-cols-2 for Author / Circle
// Then a grid-cols-2 for Barcode / Parody
// Then a flex/grid for Size & Anthology

const newFormLayout = `<form onSubmit={handleSubmit} className="space-y-3">
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

        <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-1.5">
            <Label htmlFor="circle" className="text-xs">{t('circle', 'Circle')}</Label>
            <Input
              id="circle"
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              placeholder={t('circle', 'Circle')}
              className="h-9 text-sm"
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

        <div className="grid grid-cols-2 gap-3 items-end">
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

          <div className="flex items-center space-x-2 h-9">
            <Checkbox
              id="anthology"
              checked={isAnthology}
              onCheckedChange={(c) => setIsAnthology(!!c)}
            />
            <Label htmlFor="anthology" className="text-sm font-medium leading-none cursor-pointer">
              {t('anthology', 'Anthology')}
            </Label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">`;

// replace everything from <form ...> down to <div className="flex gap-3 pt-2">
const formStart = '<form onSubmit={handleSubmit} className="space-y-3">';
const formEndStr = '<div className="flex gap-3 pt-2">';
const startIdx = code.indexOf(formStart);
const endIdx = code.indexOf(formEndStr);

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newFormLayout + code.substring(endIdx + formEndStr.length);
}

fs.writeFileSync(path, code);
console.log('BookForm updated');
