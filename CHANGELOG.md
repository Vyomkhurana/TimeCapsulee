# Changelog

All notable changes to the Time Capsule project will be documented in this file.

## [3.2.1] - 2026-01-20

### 🔧 Improvements
- Updated version numbers across application
- Enhanced version tracking consistency
- Improved API documentation accuracy

## [2.0.0] - 2025-10-28

### 🎉 Major Release - Powerful New Features!

#### ✨ Added

**Search & Filtering:**
- Advanced search with full-text capabilities
- Multi-criteria filtering (category, status, tags, priority, dates)
- Pagination support with customizable page sizes
- Sort by multiple fields (date, title, priority, etc.)

**Sharing & Collaboration:**
- Share capsules with other users via email
- Permission-based access (view/edit)
- Email notifications for shared capsules
- Track who you've shared with

**Tags System:**
- Add unlimited tags to capsules
- View all tags with usage statistics
- Search and filter by tags
- Tag suggestions based on popularity

**Smart Reminders:**
- Configurable reminder notifications (1-365 days before delivery)
- Beautiful HTML email templates for reminders
- Countdown notifications
- Automatic reminder scheduling

**Templates:**
- Create reusable capsule templates
- Public and private template sharing
- Template usage tracking
- Quick capsule creation from templates

**Priority System:**
- 4 priority levels (Low, Medium, High, Urgent)
- Filter and sort by priority
- Visual priority indicators

**Archive & Star:**
- Star/favorite important capsules
- Archive old capsules
- Filter by starred or archived status
- Better capsule organization

**Bulk Operations:**
- Bulk delete multiple capsules
- Bulk archive/unarchive
- Efficient batch processing
- Progress feedback

**Advanced Analytics:**
- Comprehensive dashboard with multiple metrics
- Category distribution charts
- Priority distribution analysis
- Monthly trend visualization
- Delivery success rate tracking
- Top tags insights
- Activity timeline

**Backup & Export:**
- Export all capsules as JSON backup
- Export analytics reports as CSV
- Complete data portability
- Timestamped backups

**Duplicate/Clone:**
- Clone existing capsules
- Edit schedule date for duplicates
- Copy all capsule data including tags and priority

**Activity Logging:**
- Track all user actions
- View activity history
- Activity statistics
- IP and user agent tracking
- Auto-cleanup of old logs (90 days)

**Enhanced Email Templates:**
- Beautiful HTML email designs
- Responsive layouts
- Brand colors and styling
- Call-to-action buttons
- Plain text fallbacks

**Security Enhancements:**
- Global rate limiting (1000 req/15min)
- Per-endpoint rate limiting
- Input validation middleware
- XSS protection
- SQL injection prevention
- Enhanced security headers (HSTS, CSP, Permissions-Policy)
- Input sanitization

**Performance Improvements:**
- Database compound indexes
- Text search indexes
- Optimized aggregation queries
- Lean queries for better performance
- Static file caching with ETags
- Efficient query filtering

**Developer Experience:**
- Comprehensive API documentation
- Better error messages
- Activity logging utility
- Email template system
- Validation middleware
- Rate limiter middleware

#### 📝 Models Added
- `ActivityLog` - User activity tracking
- `Template` - Capsule templates

#### 🔧 Changed
- Enhanced Capsule model with new fields (tags, priority, shared, archived, starred, reminder, views)
- Improved scheduler with reminder support
- Better error handling across all controllers
- Updated app.js with enhanced security headers
- Improved health check endpoint with memory usage

#### 🔒 Security
- Rate limiting on all routes
- Enhanced input validation
- XSS and injection attack prevention
- Secure headers implementation
- Activity logging for audit trails

#### 📊 API Endpoints Added
- `GET /api/capsules/search/advanced` - Advanced search
- `POST /api/capsules/share` - Share capsules
- `PATCH /api/capsules/:id/archive` - Toggle archive
- `PATCH /api/capsules/:id/star` - Toggle star
- `POST /api/capsules/bulk/delete` - Bulk delete
- `POST /api/capsules/bulk/archive` - Bulk archive
- `PATCH /api/capsules/:id/tags` - Update tags
- `GET /api/capsules/tags/all` - Get all tags
- `PATCH /api/capsules/:id/reminder` - Update reminder
- `POST /api/capsules/:id/duplicate` - Duplicate capsule
- `GET /api/capsules/templates/all` - Get templates
- `POST /api/capsules/templates/create` - Create template
- `POST /api/capsules/templates/use` - Use template
- `GET /api/capsules/backup/export` - Backup capsules
- `GET /api/capsules/analytics/advanced` - Advanced analytics
- `GET /api` - API info endpoint

---

## [1.0.0] - 2025-10-27

### 🎉 Initial Release

#### ✨ Features
- Create time capsules with messages and files
- Schedule capsules for future delivery
- Category-based organization
- Email delivery system
- User authentication with JWT
- Dashboard interface
- File upload support (10MB limit)
- Database indexing
- Session management
- Basic analytics

#### 🛠️ Tech Stack
- Node.js & Express.js
- MongoDB & Mongoose
- JWT authentication
- Nodemailer
- node-cron scheduler

---

## Version Format
- **Major.Minor.Patch** (Semantic Versioning)
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

---

**Links:**
- [GitHub Repository](https://github.com/Vyomkhurana/TimeCapsulee)
- [API Documentation](./API_DOCUMENTATION.md)
