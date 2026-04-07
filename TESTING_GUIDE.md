# Quick Start Guide - Testing Frontend-Backend Integration

## 🚀 Start Both Services

### Terminal 1: Backend Server
```bash
cd server
cp .env.example .env  # First time only - edit with your API keys
pip install -r requirements.txt  # First time only
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5000
INFO:     🚀 Starting Text-to-Learn API...
✓ GenAI client initialized  # If GEMINI_API_KEY is set
```

### Terminal 2: Frontend Development Server
```bash
cd client
npm install  # First time only
npm run dev
```

**Expected Output:**
```
VITE v8.0.2  ready in 200 ms
➜  Local:   http://localhost:5173/
```

---

## ✅ Test Integration

### 1. Health Check
Open browser: `http://localhost:5000/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "service": "text-to-learn-backend"
}
```

### 2. Access Frontend
Open browser: `http://localhost:5173`

**Expected:**
- Home page loads without errors
- No console errors about API connection
- Can enter a topic and generate course

### 3. Test Course Generation
1. Enter a topic (e.g., "Python Programming")
2. Click "Generate Course"
3. Watch progress indicator
4. Course should load after 30-60 seconds

**Backend Logs Should Show:**
```
[DEBUG] Token present: False, is_anonymous: True
[DEBUG] get_user_courses called with user sub: dev|user123
```

### 4. Test Course Navigation
- Click on different modules in sidebar
- Navigate between lessons
- Test mobile responsive (dev tools → mobile view)

---

## 🔧 Environment Setup (First Time)

### Backend (.env)
```bash
# Copy the example
cp server/.env.example server/.env

# Edit with your values
# Required for course generation:
GEMINI_API_KEY=your_actual_key_here

# Optional (works without these in dev mode):
MONGO_URI=mongodb://localhost:27017/text-to-learn
AUTH0_DOMAIN=your-auth0-domain.auth0.com
YOUTUBE_API_KEY=your_youtube_api_key
```

### Frontend (.env)
```bash
# Copy the example  
cp client/.env.example client/.env.local

# The defaults should work for local development:
VITE_API_URL=http://localhost:5000

# Auth0 is optional for local dev
# Frontend will work without it in guest mode
```

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to generate course"
**Cause:** Missing GEMINI_API_KEY  
**Solution:** Add valid Gemini API key to `server/.env`

### Issue: Frontend can't connect to backend
**Cause:** Wrong API URL  
**Solution:** Check `client/.env.local` has `VITE_API_URL=http://localhost:5000`

### Issue: CORS errors
**Cause:** Backend CORS misconfigured  
**Solution:** Verify `server/main.py` has CORS middleware enabled

### Issue: MongoDB connection error
**Cause:** MongoDB not running  
**Solution:** 
```bash
# Install and run MongoDB locally
# OR use MongoDB Atlas cloud database
# Update MONGO_URI in server/.env
```

**Note:** App runs in "mock mode" if MongoDB unavailable (limited functionality)

---

## 📱 Test Mobile UI

1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone 12/14, Pixel 5, etc.)
4. Test:
   - ✅ Sidebar toggle works
   - ✅ Course navigation drawer opens
   - ✅ All content readable without horizontal scroll
   - ✅ Touch targets are large enough
   - ✅ Forms usable with mobile keyboard

---

## 🧪 API Testing with cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Generate Course (Sync)
```bash
curl -X POST http://localhost:5000/api/generate-course \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine Learning Basics"}'
```

### Generate Course (Async)
```bash
curl -X POST http://localhost:5000/api/generate-course-async \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine Learning Basics", "level": "Beginner"}'
```

### Get Course Status
```bash
curl http://localhost:5000/api/course-status/{job_id}
```

### Get User Courses
```bash
curl http://localhost:5000/api/user/courses
```

---

## 📊 What to Verify

### ✅ Frontend
- [ ] Home page loads
- [ ] Course generation works
- [ ] Progress indicator shows
- [ ] Course displays correctly
- [ ] All lesson blocks render
- [ ] Navigation between lessons works
- [ ] Mobile responsive (sidebar, course nav)
- [ ] No console errors

### ✅ Backend
- [ ] Server starts without errors
- [ ] Health check responds
- [ ] Course generation completes
- [ ] Courses saved to MongoDB
- [ ] API logs show requests
- [ ] No 500 errors in logs

### ✅ Integration
- [ ] Frontend connects to backend
- [ ] API calls succeed (200 status)
- [ ] Data flows both directions
- [ ] Error handling works
- [ ] Auth flow works (if Auth0 configured)

---

## 🎯 Success Criteria

You'll know everything is working when:
1. ✅ Can generate a course from the frontend
2. ✅ Course displays with all blocks (text, code, MCQ, video)
3. ✅ Can navigate between modules and lessons
4. ✅ Mobile UI is responsive and functional
5. ✅ No errors in browser console
6. ✅ Backend logs show successful requests

---

## 📝 Notes

- **Development Mode:** Works without Auth0 (uses mock user `dev|user123`)
- **Mock Mode:** Works without MongoDB (limited functionality)
- **API Keys:** Only GEMINI_API_KEY is required for course generation
- **Rate Limits:** 5 course generations per hour (don't spam the button!)

---

## 🆘 Need Help?

Check these files for debugging:
- Browser console (F12) for frontend errors
- Backend terminal for server errors
- `server/logs/app.log` for detailed logs
- `COMPATIBILITY_REPORT.md` for full audit

---

Happy Testing! 🎉
