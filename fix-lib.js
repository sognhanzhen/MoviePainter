const fs = require('fs');
let code = fs.readFileSync('client/src/pages/LibraryPage.tsx', 'utf8');

if (!code.includes('const [visiblePage, setVisiblePage]')) {
  code = code.replace(
    'const { error, loading, posters } = usePosterCatalog(token);',
    'const { error, loading, posters } = usePosterCatalog(token);\n  const [visiblePage, setVisiblePage] = useState(1);\n  const VISIBLE_PER_PAGE = 32;'
  );

  code = code.replace(
    '  const displayPosters = hasActiveFilter ? visiblePosters : padPosterRow(visiblePosters);',
    '  const displayPosters = hasActiveFilter ? visiblePosters : padPosterRow(visiblePosters);\n  const paginatedPosters = useMemo(() => displayPosters.slice(0, visiblePage * VISIBLE_PER_PAGE), [displayPosters, visiblePage]);\n  const hasMoreLocal = paginatedPosters.length < displayPosters.length;'
  );

  code = code.replace(
    '  useEffect(() => {\n    if (!openFilter) {',
    '  useEffect(() => {\n    setVisiblePage(1);\n  }, [activeFilters]);\n\n  useEffect(() => {\n    if (!openFilter) {'
  );

  code = code.replace(
    '    observerRef.current = new IntersectionObserver((entries) => {\n      if (entries[0].isIntersecting && hasMoreTmdb && !syncingTmdb) {\n        setTmdbPage((prev) => prev + 1);\n      }\n    });\n    return () => observerRef.current?.disconnect();\n  }, [hasMoreTmdb, syncingTmdb]);',
    '    observerRef.current = new IntersectionObserver((entries) => {\n      if (entries[0].isIntersecting) {\n        if (hasMoreLocal) {\n          setVisiblePage(p => p + 1);\n        } else if (hasMoreTmdb && !syncingTmdb) {\n          setTmdbPage((prev) => prev + 1);\n        }\n      }\n    });\n    return () => observerRef.current?.disconnect();\n  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);'
  );

  code = code.replace(
    '{displayPosters.map((poster, index) => (',
    '{paginatedPosters.map((poster, index) => ('
  );

  code = code.replace(
    '      <div className="mt-20 flex justify-center" ref={lastElementRef}>\n        {syncingTmdb && hasMoreTmdb ? (',
    '      <div className="mt-20 flex justify-center" ref={lastElementRef}>\n        {(syncingTmdb || hasMoreLocal) ? (\n          <div className="flex items-center gap-3 space-x-2 py-8">\n            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa]"></div>\n            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.2s]"></div>\n            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.4s]"></div>\n          </div>\n        ) : hasMoreTmdb ? ('
  );

  fs.writeFileSync('client/src/pages/LibraryPage.tsx', code);
}
