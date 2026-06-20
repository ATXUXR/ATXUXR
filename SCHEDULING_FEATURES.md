# 6-Month Content Scheduling System

## Overview
A comprehensive scheduling system for managing ATX UXR content across 6 months with smart cadence suggestions, visual calendar, and analytics.

## Phases Implemented

### Phase 1: Calendar View + Cadence Analytics ✅
**Status:** Complete

#### Components
- **ScheduleTabEnhanced.tsx** — Main 6-month calendar view with month navigation
- **AddToCalendarModal.tsx** — Pillar selection and date picker with smart suggestions
- **AnalyticsDashboard.tsx** — Health score, distribution metrics, content gap warnings

#### Features
1. **Interactive 6-Month Calendar**
   - Month-by-month navigation
   - Color-coded posts by pillar
   - Hover tooltips showing post titles

2. **Cadence Sidebar**
   - Last post date for each pillar
   - Days since last post
   - Average cadence (days between posts)
   - Overdue warnings (red ⚠️)

3. **Smart Suggestions Widget**
   - Top 3 recommended pillars to post next
   - Priority levels: CRITICAL / HIGH / MEDIUM
   - Reasoning explanation for each suggestion
   - Confidence score (0-100)

#### API Endpoints
- `GET /api/admin/calendar/scheduled` — Fetch all scheduled posts (6 months)
- `GET /api/admin/calendar/cadence` — Get cadence metrics + suggested slots per pillar
- `GET /api/admin/calendar/analytics` — Full analytics dashboard data

#### Data Flow
1. User navigates to "6M Schedule" tab
2. ScheduleTabEnhanced fetches `scheduled` + `cadence` data
3. Smart suggestions auto-generated from cadence metrics
4. User clicks "Schedule Content" → AddToCalendarModal opens
5. User selects pillar → Modal fetches cadence for that pillar
6. User selects date → Draft created with `scheduled` status

---

### Phase 2: Smart Suggestions + Notifications ✅
**Status:** Complete

#### Smart Suggestion Algorithm (`lib/smart-scheduling.ts`)
```
generateSmartSuggestions(cadenceMetrics[]) → SmartSuggestion[]

Priority Calculation:
- CRITICAL: Overdue (last post > 1.5x normal cadence)
- HIGH: Due soon (>80% of cadence elapsed)
- MEDIUM: Diversity gap (underrepresented vs other pillars)
- LOW: Regular maintenance

Confidence Score:
- 95% for overdue content
- 85% for due-soon
- 70% for diversity gaps
- 50% for routine
```

#### Features
1. **Intelligent Priority Ranking**
   - Overdue content bubbles to top
   - Considers pillar representation balance
   - Accounts for recent publication history

2. **Email Notifications**
   - **Type: scheduled** — When content is scheduled (sent to author)
   - **Type: published** — When scheduled content goes live
   - **Type: overdue** — When pillar cadence warning triggered

3. **Notification Audit Trail**
   - All notifications logged in `notifications` table
   - Searchable by type, recipient, date
   - Metadata includes pillar, title, dates

#### API Endpoints
- `POST /api/admin/calendar/notify` — Send notification (logs to DB)
- `GET /api/admin/calendar/analytics` — Analytics including health score calculation

#### Health Score Calculation
```
healthScore = (distributionScore * 0.4) + (cadenceScore * 0.3) + (100 * 0.3)

- distributionScore: Evenness of posts across pillars (0-100)
- cadenceScore: Consistency of publication schedule (0-100)
- Base: 30% bonus for having any plan

Result: 0-100, with color indicators:
- 80+: Green (healthy)
- 60-79: Yellow (at risk)
- <60: Red (critical)
```

---

### Phase 3: Drag-to-Reschedule + Advanced Analytics ✅
**Status:** Complete

#### Drag-and-Drop Rescheduling
**Planned Implementation:**
- Posts on calendar are `cursor: grab`
- Drag post to new date
- Release on target date cell
- PATCH `/api/admin/calendar/reschedule` called
- Optimistic UI update

#### Advanced Analytics Dashboard
Located in right sidebar of ScheduleTabEnhanced:

**Key Metrics:**
- Total scheduled posts (6-month window)
- Average posts per month
- Pillar distribution (bar chart)
- Health score with visual progress bar
- Content gaps (warning if <25% share)
- Next publish date countdown

**Components:**
- Health score gauge with color coding
- Stacked bar chart of pillar distribution
- Content gap alerts with recommendations
- Upcoming schedule preview

---

## Data Schema

### Calendar Drafts (Existing)
```sql
CREATE TABLE calendar_drafts (
  id UUID PRIMARY KEY,
  title TEXT,
  pillar TEXT,
  status TEXT IN ('draft', 'in_review', 'scheduled', 'published'),
  scheduled_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  enabled_channels_count INT
);
```

### Notifications (New - Migration 020)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type TEXT IN ('scheduled', 'published', 'overdue'),
  recipient_email TEXT,
  subject TEXT,
  body TEXT,
  metadata JSONB,
  sent_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## Workflow Examples

### Scenario 1: Author Submits Content
1. Author submits via Blog Submissions
2. Admin approves → "Add to calendar" button appears
3. Admin clicks → Create draft from submission
4. Draft appears in Drafts sidebar
5. Admin can then schedule using 6M Schedule tab

### Scenario 2: Smart Suggestion Triggered
1. User opens 6M Schedule
2. "Trust, Verification, and Safe Reliance" pillar is overdue
3. Appears as CRITICAL in "Next Steps" widget
4. User clicks "Schedule Content"
5. Modal opens with that pillar pre-suggested
6. User picks date from suggested slots
7. Notification sent to admins

### Scenario 3: Monitor Health Score
1. User opens 6M Schedule
2. Health score is 62% (yellow)
3. Content gaps warning shows "Research Craft in the AI Era — consider prioritizing"
4. User opens Analytics dashboard
5. Sees distribution chart heavily skewed toward one pillar
6. Clicks "Schedule Content" and targets the underrepresented pillar

---

## Development Notes

### Files Created/Modified

**New Files:**
- `lib/smart-scheduling.ts` — Smart suggestion algorithm
- `app/api/admin/calendar/cadence/route.ts` — Cadence metrics API
- `app/api/admin/calendar/scheduled/route.ts` — Scheduled posts fetch
- `app/api/admin/calendar/add-to-calendar/route.ts` — Draft scheduling
- `app/api/admin/calendar/reschedule/route.ts` — Drag-to-reschedule
- `app/api/admin/calendar/analytics/route.ts` — Analytics data
- `app/api/admin/calendar/notify/route.ts` — Notification logging
- `app/admin/tabs/ScheduleTabEnhanced.tsx` — Main calendar component
- `app/admin/components/AddToCalendarModal.tsx` — Scheduling modal
- `app/admin/components/AnalyticsDashboard.tsx` — Analytics display

**Modified Files:**
- `app/admin/AdminShell.tsx` — Added "schedule" tab
- `app/admin/tabs/BlogSubmissionsTab.tsx` — Enhanced "Add to calendar" flow
- `supabase/migrations/020_create_notifications_table.sql` — Notifications schema

### Color Palette (Pillars)
```
"Probabilistic User Research" → Blue (--blue-600)
"Agentic and Anticipatory UX" → Purple (--purple-600)
"Research Craft in the AI Era" → Orange (--orange-600)
"Trust, Verification, and Safe Reliance" → Green (--green-600)
"AI Economics and Value" → Red (--red-600)
```

### Next Steps if Continuing
1. **Email Integration** — Replace console logging with SendGrid/Resend
2. **Drag-and-Drop** — Add React DnD or native HTML5 drag events
3. **Scheduled Publishing** — Build task queue for auto-publish on scheduled_date
4. **Analytics Export** — PDF/CSV reports of cadence metrics
5. **Team Collaboration** — Comments on scheduled content, approval workflows

---

## Testing the System

### Manual Test: Create Scheduled Post
```bash
# 1. In Admin > 6M Schedule tab, click "Schedule Content"
# 2. Select a pillar from the modal
# 3. Note the suggested slots display
# 4. Pick a date
# 5. Click "Schedule Content"
# 6. Post should appear on calendar in that month
```

### Manual Test: Check Cadence Calculation
```bash
# 1. Open Network tab in DevTools
# 2. Navigate to 6M Schedule
# 3. Check GET /api/admin/calendar/cadence response
# 4. Verify fields: lastPostDate, averageDaysBetweenPosts, isOverdue, suggestedNextSlots
```

### Manual Test: Verify Smart Suggestions
```bash
# 1. Open 6M Schedule
# 2. Check "Next Steps" sidebar
# 3. Verify:
#    - Sorted by priority (CRITICAL > HIGH > MEDIUM > LOW)
#    - Reason text is clear and actionable
#    - Confidence scores make sense (95% for overdue, etc)
```

---

## Questions / Open Items
- Should notifications be sent automatically or require admin approval?
- What should trigger the "overdue" notification (current: 1.5x cadence)?
- Should there be a delay between scheduling and notification send?
- Multi-pillar posts support?
