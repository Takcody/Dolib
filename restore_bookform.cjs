const fs = require('fs');

let code = fs.readFileSync('src/components/BookForm.tsx', 'utf8');

const regex = /<form onSubmit=\{handleSubmit\} className="space-y-3">[\s\S]*?<div className="flex gap-3 pt-2">/g;

const replacement = `<form onSubmit={handleSubmit} className="space-y-3">
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

          <div className="flex items-center h-9 justify-start pl-2">
            <Checkbox
              id="anthology"
              checked={isAnthology}
              onCheckedChange={(c) => setIsAnthology(!!c)}
              className="mr-2"
            />
            <Label htmlFor="anthology" className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">
              {t('anthology', 'Anthology')}
            </Label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/BookForm.tsx', code);
console.log('Restored fields and fixed Anthology checkbox vertical alignment.');