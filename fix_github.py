c = open("api/github.js", "r", encoding="utf-8").read()
# Fix duplicate comment
c = c.replace("  // -- GFI count only
 // -- GFI count only", "  // -- GFI count only")
# Status endpoint: add timeout
c = c.replace("gsoc-org-finder" },
      });", "gsoc-org-finder" },
        signal: AbortSignal.timeout(5000),
      });")
open("api/github.js", "w", encoding="utf-8").write(c)
print("done")
