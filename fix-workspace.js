const fs = require('fs');

let code = fs.readFileSync('client/src/pages/WorkspacePage.tsx', 'utf8');

const targetStr1 = `    hydrateComposerFromRecord(targetRecord);
  }
  }

  return (
    <section className="space-y-16">`;

const targetStr2 = `    hydrateComposerFromRecord(targetRecord);\r\n  }\r\n  }\r\n\r\n  return (\r\n    <section className="space-y-16">`;

const targetStr3 = `    hydrateComposerFromRecord(targetRecord);\n  }\n  }\n\n  return (\n    <section className="space-y-16">`;

const correctStr = `    hydrateComposerFromRecord(targetRecord);
  }

  const activeIndex = panelRecord ? chatGenerationDeck.findIndex((item) => item.id === panelRecord.id) : -1;
  const canViewNewer = activeIndex > 0 && panelRecord?.status !== "submitting";
  const canViewOlder = activeIndex >= 0 && activeIndex < chatGenerationDeck.length - 1 && panelRecord?.status !== "submitting";

  function clearSelectedPoster() {
    if (searchParams.has("posterId")) {
      setSearchParams((prev) => {
        prev.delete("posterId");
        return prev;
      }, { replace: true });
    }
  }

  return (
    <section className="space-y-16">`;

if (code.includes(targetStr1)) {
  code = code.replace(targetStr1, correctStr);
} else if (code.includes(targetStr2)) {
  code = code.replace(targetStr2, correctStr);
} else if (code.includes(targetStr3)) {
  code = code.replace(targetStr3, correctStr);
} else {
  // Regex as fallback
  code = code.replace(/    hydrateComposerFromRecord\(targetRecord\);\r?\n  \}\r?\n  \}\r?\n\r?\n  return \(\r?\n    <section className=\"space-y-16\">/, correctStr);
}

fs.writeFileSync('client/src/pages/WorkspacePage.tsx', code);
console.log('Fixed WorkspacePage.tsx');
