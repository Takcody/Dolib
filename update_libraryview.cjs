const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

// 1. Add "circle" and "anthology" to SortBy state
code = code.replace(
  /useState\<'date' \| 'alpha' \| 'duplicates' \| 'author' \| 'parody'\>/,
  "useState<'date' | 'alpha' | 'duplicates' | 'author' | 'circle' | 'parody' | 'anthology'>"
);

// 2. Add "circle" to search filter logic
code = code.replace(
  /book\.parody\?\.toLowerCase\(\)\.includes\(query\)/,
  "book.parody?.toLowerCase().includes(query) ||\n      book.circle?.toLowerCase().includes(query)"
);

// 3. Add filtering/sorting logic for circle and anthology
const oldSortLogic = `} else if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'parody') {
      result.sort((a, b) => (a.parody || '').localeCompare(b.parody || ''));
    } else {
      result.sort((a, b) => b.addedAt - a.addedAt);
    }`;

const newSortLogic = `} else if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'circle') {
      result.sort((a, b) => (a.circle || '').localeCompare(b.circle || ''));
    } else if (sortBy === 'parody') {
      result.sort((a, b) => (a.parody || '').localeCompare(b.parody || ''));
    } else if (sortBy === 'anthology') {
      result = result.filter(book => book.isAnthology);
      result.sort((a, b) => b.addedAt - a.addedAt); // sort anthologies by date
    } else {
      result.sort((a, b) => b.addedAt - a.addedAt);
    }`;

code = code.replace(oldSortLogic, newSortLogic);

// 4. Import icons
// Check if Users is imported
if (!code.includes('Users')) {
  code = code.replace(/FolderOpen,/g, 'FolderOpen,\n  Users,\n  BookOpen,');
}

// 5. Update dropdown icons
code = code.replace(
  /\{sortBy === 'parody' && <FolderOpen className="w-4 h-4" \/>\}/,
  `{sortBy === 'circle' && <Users className="w-4 h-4" />}\n                    {sortBy === 'parody' && <FolderOpen className="w-4 h-4" />}\n                    {sortBy === 'anthology' && <BookOpen className="w-4 h-4" />}`
);

// 6. Update dropdown labels
code = code.replace(
  /\{sortBy === 'parody' && t\('sort_parody', 'Parody\/Category'\)\}/,
  `{sortBy === 'circle' && t('sort_circle', 'Circle')}\n                      {sortBy === 'parody' && t('sort_parody', 'Parody/Category')}\n                      {sortBy === 'anthology' && t('sort_anthology', 'Anthology')}`
);

// 7. Update SelectItem choices
const selectParody = `<SelectItem value="parody">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{t('sort_parody', 'Parody')}</span>
                  </div>
                </SelectItem>`;

const selectCircleAndAnthology = `<SelectItem value="circle">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{t('sort_circle', 'Circle')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="parody">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{t('sort_parody', 'Parody / Category')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="anthology">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{t('sort_anthology', 'Anthology')}</span>
                  </div>
                </SelectItem>`;

code = code.replace(selectParody, selectCircleAndAnthology);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log('LibraryView updated');
