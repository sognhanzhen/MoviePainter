const fs = require('fs');

let code = fs.readFileSync('client/src/pages/LibraryPage.tsx', 'utf8');

const hookBlock = `  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) {
          setVisiblePage(p => p + 1);
        } else if (hasMoreTmdb && !syncingTmdb) {
          setTmdbPage((prev) => prev + 1);
        }
      }
    });
    return () => observerRef.current?.disconnect();
  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);

  const lastElementRef = (node: HTMLElement | null) => {
    if (loading || syncingTmdb) return;
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current?.observe(node);
    }
  };
`;

const hookBlockPattern = /  useEffect\(\(\) => \{\r?\n    observerRef\.current = new IntersectionObserver\(\(entries\) => \{\r?\n      if \(entries\[0\]\.isIntersecting\) \{\r?\n        if \(hasMoreLocal\) \{\r?\n          setVisiblePage\(p => p \+ 1\);\r?\n        \} else if \(hasMoreTmdb && !syncingTmdb\) \{\r?\n          setTmdbPage\(\(prev\) => prev \+ 1\);\r?\n        \}\r?\n      \}\r?\n    \}\);\r?\n    return \(\) => observerRef\.current\?\.disconnect\(\);\r?\n  \}, \[hasMoreLocal, hasMoreTmdb, syncingTmdb\]\);\r?\n\r?\n  const lastElementRef = \(node: HTMLElement \| null\) => \{\r?\n    if \(loading \|\| syncingTmdb\) return;\r?\n    if \(observerRef\.current\) observerRef\.current\.disconnect\(\);\r?\n    if \(node\) \{\r?\n      observerRef\.current\?\.observe\(node\);\r?\n    \}\r?\n  \};\r?\n/;

if (code.match(hookBlockPattern)) {
    code = code.replace(hookBlockPattern, '');
} else {
    // If it doesn't match the strict regex, we strip it out literally.
    code = code.replace(`  useEffect(() => {\n    observerRef.current = new IntersectionObserver((entries) => {\n      if (entries[0].isIntersecting) {\n        if (hasMoreLocal) {\n          setVisiblePage(p => p + 1);\n        } else if (hasMoreTmdb && !syncingTmdb) {\n          setTmdbPage((prev) => prev + 1);\n        }\n      }\n    });\n    return () => observerRef.current?.disconnect();\n  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);\n\n  const lastElementRef = (node: HTMLElement | null) => {\n    if (loading || syncingTmdb) return;\n    if (observerRef.current) observerRef.current.disconnect();\n    if (node) {\n      observerRef.current?.observe(node);\n    }\n  };\n`, '');
    code = code.replace(`  useEffect(() => {\r\n    observerRef.current = new IntersectionObserver((entries) => {\r\n      if (entries[0].isIntersecting) {\r\n        if (hasMoreLocal) {\r\n          setVisiblePage(p => p + 1);\r\n        } else if (hasMoreTmdb && !syncingTmdb) {\r\n          setTmdbPage((prev) => prev + 1);\r\n        }\r\n      }\r\n    });\r\n    return () => observerRef.current?.disconnect();\r\n  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);\r\n\r\n  const lastElementRef = (node: HTMLElement | null) => {\r\n    if (loading || syncingTmdb) return;\r\n    if (observerRef.current) observerRef.current.disconnect();\r\n    if (node) {\r\n      observerRef.current?.observe(node);\r\n    }\r\n  };\r\n`, '');
}

const insertionPoint1 = `  const hasMoreLocal = paginatedPosters.length < displayPosters.length;\n`;
const insertionPoint2 = `  const hasMoreLocal = paginatedPosters.length < displayPosters.length;\r\n`;

if (code.includes(insertionPoint2)) {
    code = code.replace(insertionPoint2, insertionPoint2 + "\n" + hookBlock + "\n");
} else if (code.includes(insertionPoint1)) {
    code = code.replace(insertionPoint1, insertionPoint1 + "\n" + hookBlock + "\n");
}

fs.writeFileSync('client/src/pages/LibraryPage.tsx', code);
console.log('Fixed LibraryPage.tsx Hoist Error');
