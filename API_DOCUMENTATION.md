# Time Capsule API Documentation v2.0

## 🚀 Overview
Time Capsule is a powerful digital time capsule application with advanced features including search, sharing, templates, analytics, and more.

## 🔑 Base URL
```
http://localhost:3000
```

## 📚 API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /api` - API information

---

## 📦 Capsule Management

### Create Capsule
```http
POST /api/capsules/create
Content-Type: multipart/form-data

{
  "title": "My Time Capsule",
  "message": "A message from the past",
  "category": "personal",
  "scheduleDate": "2026-12-31",
  "creator": "userId",
  "tags": ["memory", "2025"],
  "priority": "medium"
}
```

### Get My Capsules
```http
GET /api/capsules/my-capsules?userId=USER_ID
```

### Get Single Capsule
```http
GET /api/capsules/:id
```

### Delete Capsule
```http
DELETE /api/capsules/delete/:id
```

---

## 🔍 Search & Filtering

### Advanced Search
```http
GET /api/capsules/search/advanced?userId=USER_ID&query=search&category=personal&status=pending&tags=memory,family&priority=high&starred=true&archived=false&dateFrom=2025-01-01&dateTo=2025-12-31&sortBy=createdAt&sortOrder=desc&page=1&limit=20
```

**Query Parameters:**
- `query` - Text search
- `category` - Filter by category
- `status` - Filter by status (pending/delivered/failed)
- `tags` - Comma-separated tags
- `priority` - Filter by priority (low/medium/high/urgent)
- `starred` - Filter starred capsules (true/false)
- `archived` - Show archived capsules (true/false)
- `dateFrom` - Start date
- `dateTo` - End date
- `sortBy` - Sort field (createdAt, scheduleDate, title)
- `sortOrder` - Sort order (asc/desc)
- `page` - Page number
- `limit` - Items per page

---

## 🏷️ Tags Management

### Get All Tags
```http
GET /api/capsules/tags/all?userId=USER_ID
```

### Update Capsule Tags
```http
PATCH /api/capsules/:capsuleId/tags
Content-Type: application/json

{
  "tags": ["memory", "family", "important"]
}
```

---

## ⭐ Archive & Star Features

### Toggle Archive
```http
PATCH /api/capsules/:capsuleId/archive
```

### Toggle Star/Favorite
```http
PATCH /api/capsules/:capsuleId/star
```

---

## 🔔 Reminder Management

### Update Reminder Settings
```http
PATCH /api/capsules/:capsuleId/reminder
Content-Type: application/json

{
  "enabled": true,
  "daysBeforeDelivery": 7
}
```

---

## 📤 Sharing Features

### Share Capsule
```http
POST /api/capsules/share
Content-Type: application/json

{
  "capsuleId": "CAPSULE_ID",
  "userEmail": "friend@example.com",
  "permission": "view"
}
```

---

## 📋 Bulk Operations

### Bulk Delete
```http
POST /api/capsules/bulk/delete
Content-Type: application/json

{
  "capsuleIds": ["id1", "id2", "id3"]
}
```

### Bulk Archive
```http
POST /api/capsules/bulk/archive
Content-Type: application/json

{
  "capsuleIds": ["id1", "id2", "id3"],
  "archive": true
}
```

---

## 📑 Templates

### Get Templates
```http
GET /api/capsules/templates/all?userId=USER_ID
```

### Create Template from Capsule
```http
POST /api/capsules/templates/create
Content-Type: application/json

{
  "capsuleId": "CAPSULE_ID",
  "name": "Birthday Template",
  "description": "Template for birthday messages",
  "isPublic": false
}
```

### Create Capsule from Template
```http
POST /api/capsules/templates/use?userId=USER_ID
Content-Type: application/json

{
  "templateId": "TEMPLATE_ID",
  "title": "My Birthday Capsule",
  "scheduleDate": "2026-12-31",
  "customMessage": "Optional custom message"
}
```

---

## 🔄 Duplicate Capsule

### Duplicate/Clone Capsule
```http
POST /api/capsules/:capsuleId/duplicate
Content-Type: application/json

{
  "scheduleDate": "2026-12-31"
}
```

---

## 📊 Analytics & Reports

### Get Statistics
```http
GET /api/capsules/statistics
```

### Get Activity Data
```http
GET /api/capsules/activity?period=week
```
**Periods:** week, month, year

### Get Category Distribution
```http
GET /api/capsules/categories
```

### Get Recent Activity
```http
GET /api/capsules/recent-activity
```

### Advanced Analytics
```http
GET /api/capsules/analytics/advanced?userId=USER_ID
```

**Returns:**
- Overview statistics
- Category distribution
- Priority distribution
- Delivery success rate
- Top tags
- Monthly trend

### Export Report (CSV)
```http
GET /api/capsules/export-report
```

### Backup Capsules (JSON)
```http
GET /api/capsules/backup/export?userId=USER_ID
```

---

## 🎨 Capsule Categories
- `personal` - Personal memories
- `special` - Special occasions
- `academic` - Academic achievements
- `mental` - Mental health & wellness
- `business` - Business milestones
- `legacy` - Legacy messages
- `social` - Social events

## 🎯 Priority Levels
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent

## 📊 Capsule Status
- `pending` - Waiting to be delivered
- `delivered` - Successfully delivered
- `failed` - Delivery failed

---

## 🔒 Security Features

### Rate Limiting
- Global: 1000 requests per 15 minutes per IP
- Capsule creation: 50 requests per hour
- Custom rate limits per endpoint

### Input Validation
- XSS protection
- SQL injection prevention
- Input sanitization
- File type validation
- File size limits (10MB)

### Security Headers
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Referrer-Policy
- Permissions-Policy

---

## 📧 Email Notifications

### Automated Emails
1. **Capsule Delivery** - Beautiful HTML email when capsule opens
2. **Reminders** - Countdown notifications before opening
3. **Sharing Notifications** - When capsule is shared

### Email Templates
All emails use professional HTML templates with:
- Responsive design
- Brand colors
- Call-to-action buttons
- Fallback plain text

---

## 🎯 Performance Features

### Caching
- Static file caching (1 day in production)
- ETag support

### Database Optimization
- Indexed queries
- Compound indexes
- Aggregation pipelines
- Lean queries

### Pagination
- Configurable page sizes
- Skip-based pagination
- Total count included

---

## 🧪 Testing Endpoints

### Test Capsule Creation
```bash
curl -X POST http://localhost:3000/api/capsules/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Capsule",
    "message": "Hello from the past!",
    "category": "personal",
    "scheduleDate": "2026-01-01",
    "creator": "USER_ID"
  }'
```

### Test Search
```bash
curl "http://localhost:3000/api/capsules/search/advanced?userId=USER_ID&query=test&page=1&limit=10"
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "capsule": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

### Paginated Response
```json
{
  "capsules": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🚀 New Features in v2.0

✅ Advanced search with multiple filters  
✅ Capsule sharing with permissions  
✅ Tags system for organization  
✅ Archive & star/favorite capsules  
✅ Bulk operations (delete, archive)  
✅ Reminder notifications  
✅ Template system  
✅ Capsule duplication  
✅ Activity logging  
✅ Advanced analytics dashboard  
✅ Backup & restore  
✅ Enhanced email templates  
✅ Rate limiting & security  
✅ Input validation & sanitization  
✅ Performance optimizations  

---

## 📞 Support
For issues or questions, please open an issue on GitHub.

---

**Version:** 2.0.0  
**Last Updated:** October 28, 2025
