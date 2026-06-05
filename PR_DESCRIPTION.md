Closes #1311

## Description
Prevents unhandled localStorage.setItem() exceptions from crashing the app when storage is unavailable.

## Type of Change
- Bug fix (fixes issue #1311)

## Checklist
- [x] Code follows style guidelines
- [x] Changes wrapped in try-catch
- [x] No console errors on startup

---
## Security Improvements
- ✅ Wrapped all JSON.parse in try-catch blocks
- ✅ Added null/undefined checks for object access
- ✅ Protected against malformed API responses
- ✅ Safe error handling without data loss
---
