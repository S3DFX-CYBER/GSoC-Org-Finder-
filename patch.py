content = open("index.html", "r", encoding="utf-8").read()
old = "  <!-- Hidden search input for JavaScript compatibility -->"
btn = "  <!-- Graph View Toggle -->
  <div class="flex justify-end mb-4">
    <button id="graphToggleBtn" onclick="toggleGraphView()" class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md">🌐 Graph View</button>
  </div>

  <!-- Hidden search input for JavaScript compatibility -->"
open("index.html", "w", encoding="utf-8").write(content.replace(old, btn, 1))
print("done")
