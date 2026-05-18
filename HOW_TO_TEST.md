# 🧪 How to Test - Local Server Setup

## ⚠️ CORS Error Fix

The errors you're seeing are **normal** when opening HTML files directly (`file://` protocol). You need to run a **local web server** to test properly.

---

## ✅ Solution: Run Local Server

### Option 1: Python HTTP Server (Recommended - Already Running!)

**I've started a Python server for you at:**
```
http://localhost:3000
```

**To access:**
1. Open your browser
2. Go to: `http://localhost:3000`
3. The application should load without CORS errors

**To stop the server:**
- Press `Ctrl+C` in the terminal where it's running
- Or close the terminal window

---

### Option 2: Node.js Serve (Alternative)

If Python server doesn't work, try:

```bash
# Install serve globally (one time)
npm install -g serve

# Run server
serve . -p 3000
```

Then open: `http://localhost:3000`

---

### Option 3: VS Code Live Server (If using VS Code)

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## 🧪 Testing Steps (After Server is Running)

### 1. Open Application
```
http://localhost:3000
```

### 2. Test Explorer Badge
1. Click on **10 different organization cards** (VIEW button)
2. After 10th view, you should see a **toast notification**
3. Open DevTools (F12) → Application → Local Storage
4. Check `gssoc_badges` key: should show `{"explorer": 10, ...}`

### 3. Test Analytics Panel
1. Click **📊 Analytics button** in header
2. Verify:
   - Badge indicator shows "🏆 1/8"
   - Info text visible: "Badges are stored locally..."
   - Explorer badge shows Bronze level
   - Progress bar visible

### 4. Test Comparator Badge
1. Click **Compare button** on 5 different organizations
2. Toast notification should appear
3. Badge indicator updates to "🏆 2/8"

### 5. Test Persistence
1. Refresh the page (F5)
2. Open Analytics panel
3. Badges should still be unlocked

### 6. Test Reset
1. Click "Reset Progress" button
2. Confirm dialog (mentions browser data)
3. All badges reset to 0

---

## 🐛 Troubleshooting

### Server not starting?

**Python not installed?**
```bash
# Check if Python is installed
python --version

# If not, download from: https://www.python.org/downloads/
```

**Port 3000 already in use?**
```bash
# Try a different port
python -m http.server 8080

# Then open: http://localhost:8080
```

### Still seeing CORS errors?

**Make sure you're accessing via `http://localhost:3000`**
- ❌ NOT: `file:///C:/Users/...`
- ✅ YES: `http://localhost:3000`

### Badge system not working?

**Check browser console:**
```javascript
// Type in console (F12)
typeof BadgeSystem
// Should return: "object"

// Check if badges-mvp.js loaded
BadgeSystem.getBadgeStats()
// Should return badge statistics
```

---

## ✅ Expected Behavior (No Errors)

When running on local server, you should see:
- ✅ No CORS errors
- ✅ Mentor data loads successfully
- ✅ Issues data loads successfully
- ✅ Service worker registers (optional)
- ✅ Badge system works perfectly

---

## 📊 Quick Verification

### Console should show:
```
✅ No CORS errors
✅ No "Failed to fetch" errors
✅ Badge system loaded
✅ Data files loaded
```

### localStorage should contain:
```json
{
  "gssoc_badges": "{\"explorer\":0,\"comparator\":0,\"unlockedBadges\":[]}",
  "theme": "light",
  "bookmarks": "[]"
}
```

---

## 🎯 Current Server Status

**✅ Python HTTP Server is RUNNING**
- **URL:** http://localhost:3000
- **Status:** Active
- **Port:** 3000

**To access:**
1. Open browser
2. Navigate to: `http://localhost:3000`
3. Start testing!

---

## 🚀 Ready to Test!

1. ✅ Server is running at `http://localhost:3000`
2. ✅ Open that URL in your browser
3. ✅ Follow testing steps above
4. ✅ No more CORS errors!

**Happy testing!** 🎉

---

## 💡 Pro Tip

**Always use a local server when developing web applications!**

CORS errors are a security feature that prevents:
- Loading files from different origins
- Accessing local files directly
- Cross-site scripting attacks

Running a local server simulates a real web environment and avoids these issues.

---

## 📝 After Testing

Once testing is complete:
1. Stop the server (Ctrl+C)
2. If everything works, create your PR
3. Use `PR_DESCRIPTION.md` as the description

**Good luck!** 🚀
