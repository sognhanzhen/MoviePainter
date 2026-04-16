const fs = require('fs');
let code = fs.readFileSync('client/src/pages/LibraryPage.tsx', 'utf8');

code = code.replace(
  /observerRef\.current = new IntersectionObserver\(\(entries\) => \{\r?\n\s*if \(entries\[0\]\.isIntersecting && hasMoreTmdb && !syncingTmdb\) \{\r?\n\s*setTmdbPage\(\(prev\) => prev \+ 1\);\r?\n\s*\}\r?\n\s*\}\);\r?\n\s*return \(\) => observerRef\.current\?\.disconnect\(\);\r?\n\s*\}, \[hasMoreTmdb, syncingTmdb\]\);/,
  `observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) {
          setVisiblePage(p => p + 1);
        } else if (hasMoreTmdb && !syncingTmdb) {
          setTmdbPage((prev) => prev + 1);
        }
      }
    });
    return () => observerRef.current?.disconnect();
  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);`
);

code = code.replace(
  /\{syncingTmdb && hasMoreTmdb \? \(/,
  `{(syncingTmdb || hasMoreLocal) ? (`
);

code = code.replace(
  /\) : hasMoreTmdb \? \(/,
  `) : hasMoreTmdb && !hasMoreLocal ? (`
);

fs.writeFileSync('client/src/pages/LibraryPage.tsx', code);
