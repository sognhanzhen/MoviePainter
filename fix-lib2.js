const fs = require('fs');
let code = fs.readFileSync('client/src/pages/LibraryPage.tsx', 'utf8');

const targetStr = `      <div className="mt-20 flex justify-center" ref={lastElementRef}>
        {syncingTmdb && hasMoreTmdb ? (
          <div className="flex items-center gap-3 space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.4s]"></div>
          </div>
        ) : hasMoreTmdb ? (
          <button
            type="button"
            onClick={() => setTmdbPage(prev => prev + 1)}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 py-4 font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-[#410001] uppercase shadow-lg shadow-[#e50914]/20 transition hover:scale-105 active:scale-95"
          >
            Discover More Work
          </button>
        ) : (
          <p className="text-sm font-bold tracking-[0.1em] text-neutral-500 uppercase">You've reached the end</p>
        )}
      </div>`;

const replacementStr = `      <div className="mt-10 mb-20 flex justify-center" ref={lastElementRef}>
        {(syncingTmdb || hasMoreLocal) ? (
          <div className="flex items-center gap-3 space-x-2 py-8">
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.4s]"></div>
          </div>
        ) : hasMoreTmdb ? (
          <button
            type="button"
            onClick={() => setTmdbPage(prev => prev + 1)}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 py-4 font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-[#410001] uppercase shadow-lg shadow-[#e50914]/20 transition hover:scale-105 active:scale-95"
          >
            Discover More Work
          </button>
        ) : (
          <p className="text-sm font-bold tracking-[0.1em] text-neutral-500 uppercase">You've reached the end</p>
        )}
      </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('client/src/pages/LibraryPage.tsx', code);
