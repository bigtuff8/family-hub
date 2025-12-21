# Family Hub - Requirements Document

## Project Overview

**Name:** Family Hub (DIY Raspberry Pi Family Organization System)

**Vision:** Create a comprehensive, customizable family organization system as an open-source alternative to commercial products like Skylight Calendar and Dragon Touch displays. The system prioritizes flexibility, privacy, and scalability while avoiding vendor lock-in.

**Primary Objectives:**

1. Build a functional family organization hub for immediate household use
1. Design architecture capable of scaling to commercial SaaS offering
1. Maintain £0 development and prototype costs
1. Create learning opportunity aligned with work technologies where practical

**Target Lifespan:** 3-5 years operational, with commercial scaling potential

-----

## Project Constraints

### Hard Constraints

- **Cost:** £0 during development and prototype phase
- **Hardware:** Raspberry Pi 5 (8GB) with 15.6"-27" touchscreen display
- **Timeline:** Functional prototype "sooner rather than later" but no strict deadline
- **Skill Level:** Beginner (skill level 0) - must be approachable with Claude assistance
- **Architecture:** Must support future multi-tenant SaaS model without refactoring

### Soft Constraints

- **Work Alignment:** Prefer alignment with work tech stack where it doesn't compromise scalability/cost/timeline (40% priority vs 60% for scalability/cost/speed)
- **Technology:** Prefer well-known, proven, transferable technologies over cutting-edge
- **Complexity:** Moderate deployment complexity acceptable, minimize change management complexity

-----

## Competitive Analysis

### Commercial Products Analyzed

- **Skylight Calendar** (~£150-200)
- **Dragon Touch** displays
- **Omi Hero** family hub

### Key Learnings

**Strengths to Replicate:**

- Calendar sync with multiple providers
- Visual family member assignment
- Task/chore management
- Meal planning integration
- Shopping list features
- Photo slideshow capabilities

**Weaknesses to Avoid:**

- Vendor lock-in to proprietary ecosystems
- Calendar syncing reliability issues
- Limited customization options
- Subscription-based pricing models
- Privacy concerns with cloud-only storage

### Competitive Advantages (Our Product)

- Open-source foundation
- Self-hosting option (privacy-focused)
- Unlimited customization potential
- No vendor lock-in
- Cost-effective (DIY approach)
- Learning/tinkering value
- Potential for commercial scaling with dual open-source/hosted model

-----

## User Personas

### Primary Users

**1. Family Administrator (Parent)**

- Needs: System management, oversight of all family activities
- Goals: Coordination, planning, household management
- Technical capability: Basic to intermediate
- Access level: Full admin rights, analytics, multi-tenant management

**2. Adult Family Member (Parent/Guardian)**

- Needs: Calendar management, task coordination, meal planning
- Goals: Stay organized, coordinate with family
- Technical capability: Basic
- Access level: Standard user with family visibility

**3. Child Family Member (Age 6-18)**

- Needs: Age-appropriate task lists, reward tracking, schedule visibility
- Goals: Know responsibilities, earn rewards, see family schedule
- Technical capability: Basic (touch interface)
- Access level: Limited, age-appropriate content

### Secondary Users (Future)

**4. Extended Family (Grandparents, etc.)**

- Needs: View-only or limited interaction with family schedule
- Goals: Stay connected, coordinate visits
- Access level: Guest/viewer role

**5. Beta Testers (Friends/Family)**

- Needs: Test system as separate tenant
- Goals: Provide feedback, validate features
- Access level: Full family admin for their own tenant

-----

## Functional Requirements

### Phase 1: Essential Family Features (MVP)

#### 1.1 Calendar Management

**Priority:** Critical

- Sync with Google Calendar, iCloud, Outlook (CalDAV/CardDAV)
- Display unified family calendar view
- Color-coded by family member
- Add/edit/delete events via touchscreen
- Recurring event support
- Event reminders/notifications
- Monthly/weekly/daily view options

#### 1.2 User/Member Profiles

**Priority:** Critical

- Create profiles for each family member
- Assign avatar/photo to each member
- Set age-appropriate permissions
- Track member-specific data (tasks completed, points earned)
- Profile-based filtering (show only my tasks/events)

#### 1.3 Weather Widget

**Priority:** High

- Current weather conditions
- 5-7 day forecast
- Location-based (configurable)
- Weather alerts/warnings

#### 1.4 Kitchen Timers

**Priority:** High

- Multiple concurrent timers
- Name/label each timer
- Visual and audio alerts
- Quick preset times (1, 3, 5, 10, 15, 30 minutes)

#### 1.5 Meal Planning

**Priority:** High

- Weekly meal planner (breakfast, lunch, dinner)
- Recipe storage and display
- Link meals to shopping list
- Dietary preferences/restrictions
- Meal rotation suggestions

#### 1.6 Shopping Lists

**Priority:** High

- Create/manage multiple lists (groceries, household, etc.)
- Add items via touch or voice (future)
- Categorize items (produce, dairy, meat, etc.)
- Check off items as purchased
- Shared list editing (multiple family members)
- Integration with meal plan (auto-add ingredients)

#### 1.7 Task/Chore Management

**Priority:** High

- Create tasks assigned to family members
- Due dates and recurring schedules
- Task categories (daily chores, homework, etc.)
- Visual status (pending, in progress, complete)
- Task completion confirmation
- Age-appropriate task visibility

#### 1.8 Photo Slideshow

**Priority:** Medium

- Display family photos during idle time
- Configurable slideshow timing
- Photo upload via mobile app/web interface
- Folder/album organization
- Date/event-based filtering

-----

### Phase 1.5: Engagement & Accessibility Features

#### 1.9 Chore Gamification

**Priority:** Medium

- Point system for completed tasks
- Reward tiers/milestones
- Visual progress tracking
- Family leaderboard (optional, configurable)
- Reward redemption system (defined by parents)
- Achievement badges

#### 1.10 Mobile PWA Access

**Priority:** High

- Progressive Web App for mobile devices
- Access all features remotely (outside home network)
- Add tasks/events on the go
- Push notifications for reminders
- Sync with wall-mounted display

#### 1.11 Enhanced Notifications

**Priority:** Medium

- On-screen alerts for upcoming events
- Sound notifications (configurable)
- Reminder cadence (5 min, 15 min, 1 hour before)
- Priority levels (urgent, normal, low)
- Do Not Disturb mode (time-based)

-----

### Phase 2: Advanced & Integration Features

#### 2.1 Smart Home Integration

**Priority:** Low (Future)

- Control lights, thermostats, locks
- Display smart device status
- Automation triggers (morning routine, bedtime, etc.)
- Integration with Home Assistant, HomeKit, or similar

#### 2.2 Voice Control

**Priority:** Low (Future)

- Voice commands for hands-free operation
- Add tasks, set timers, check calendar
- Privacy-focused (local processing preferred)

#### 2.3 Recipe API Integration

**Priority:** Low (Future)

- Search recipes from external APIs
- Import recipes to meal plan
- Nutritional information
- Cooking instructions display

#### 2.4 NHS App Integration

**Priority:** Low (Nice-to-Have)

- Deep links to NHS App for appointments
- Parse appointment confirmation emails
- Reminders for GP appointments, vaccinations
- Future: Official NHS App API integration (requires approval)

#### 2.5 Find My Phone Integration

**Priority:** Medium (Phase 2)

- Locate family member phones using device APIs
- "Where's Tommy's phone?" quick action buttons
- Display last known location on map
- Ring phone remotely (even if on silent)
- Battery status display
- Integration with Find My iPhone (iOS) and Find My Device (Android)
- Permission-based access (requires family sharing setup)

**Use Cases:**

- Locate misplaced phone in house
- Check kids' phone location when expected home
- Emergency contact/location verification
- Ring phone to help find it
- Check battery level before family members leave

**API Options:**

- Apple Find My iPhone API (via iCloud)
- Google Find My Device API
- Or deep links to native apps if APIs unavailable

#### 2.6 Tile Tracker Integration

**Priority:** Low (Nice-to-Have)

- Quick access buttons to trigger "Find My" for tagged items (keys, wallet, etc.)
- Integration with Tile app API (if available)
- Display last known location of tagged items
- Battery status for Tile devices
- Add/remove tracked items from Family Hub interface

**Use Cases:**

- "Where are my keys?" - Press button to make Tile ring
- Check last known location before leaving house
- Family members can help locate each other's items
- Kids can find their school bags/lunch boxes

**Implementation Notes:**

- Phase 1: Simple deep links to open Tile app
- Phase 2: API integration if Tile opens public API
- Phase 3: Consider DIY tracker alternative (see spin-off project document)

-----

## Non-Functional Requirements

### Performance

- Page load time: < 2 seconds on local network
- Touch response: < 100ms
- Calendar sync: Every 5-15 minutes (configurable)
- Uptime target (Phase 1): 95% (Pi-based, acceptable restarts)
- Uptime target (Phase 3): 99.9% (cloud-hosted SaaS)

### Scalability

- Support 1-10 family members per tenant (Phase 1)
- Support 1,000+ tenants (Phase 3)
- Database design accommodates millions of events/tasks
- Horizontal scaling capability (add more servers as needed)

### Security

- HTTPS/SSL encryption for all connections
- Secure authentication (OAuth2/JWT)
- Role-based access control (admin, parent, child)
- Data isolation between tenants (multi-tenancy security)
- Regular security updates
- GDPR compliance (data export, deletion rights)

### Privacy

- Self-hosting option available (no cloud requirement)
- Minimal data collection
- No third-party tracking/analytics (optional, user-controlled)
- Transparent data usage policies
- User controls for data sharing/export

### Usability

- Touch-optimized interface (large buttons, clear labels)
- Age-appropriate UI for children
- Accessible color contrast and font sizes
- Minimal learning curve (intuitive design)
- Consistent design patterns (Ant Design system)

### Maintainability

- Well-documented codebase
- Modular architecture (easy to extend)
- Automated testing (unit, integration)
- CI/CD pipeline for deployments
- Version control (Git)
- Database migrations managed (Alembic)

### Reliability

- Automated backups (daily)
- Data redundancy (cloud deployments)
- Graceful error handling
- Logging and monitoring (Application Insights, Serilog-equivalent)
- Rollback capability for failed deployments

-----

## Technical Requirements

### Hardware

- **Primary:** Raspberry Pi 5 (8GB RAM)
- **Display:** 15.6"-27" touchscreen (HDMI + USB touch)
- **Storage:** 64GB+ microSD or SSD
- **Network:** WiFi or Ethernet connection
- **Power:** Official Raspberry Pi power supply

### Software Stack

- **Backend:** Python 3.11+ with FastAPI
- **Frontend:** React 18 + TypeScript, Ant Design components
- **Database:** PostgreSQL 15
- **Authentication:** Supabase Auth or similar OAuth2 provider
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** Supervisor or systemd

### Development Tools

- **Version Control:** Git (GitHub or Bitbucket)
- **CI/CD:** GitHub Actions or Azure DevOps Pipelines
- **Code Editor:** Any (VS Code recommended)
- **AI Assistant:** Claude for code generation and learning
- **Design:** Figma (optional, for custom designs)

### Deployment Environments

- **Development:** Local machine (laptop/desktop)
- **Staging:** Raspberry Pi (test environment)
- **Production (Phase 1):** Raspberry Pi (home)
- **Production (Phase 3):** Cloud (Fly.io, Railway, or Azure)

-----

## Data Requirements

### Data Entities

**1. Tenants (Families)**

- Unique tenant ID
- Family name
- Subscription tier (free, pro, enterprise)
- Created date
- Billing information (future)
- Feature flags

**2. Users (Family Members)**

- User ID
- Tenant ID (foreign key)
- Name
- Email (optional for children)
- Avatar/photo
- Role (admin, parent, child)
- Age/birthdate (for age-appropriate content)
- Preferences (notification settings, theme, etc.)

**3. Calendar Events**

- Event ID
- Tenant ID
- User ID (assigned to)
- Title
- Description
- Start time
- End time
- All-day flag
- Recurrence pattern
- Calendar source (Google, iCloud, manual)
- External calendar ID (for sync)

**4. Tasks/Chores**

- Task ID
- Tenant ID
- User ID (assigned to)
- Title
- Description
- Due date
- Recurrence pattern
- Status (pending, in progress, complete)
- Points value
- Category (chore, homework, personal)
- Created by (user ID)

**5. Meals**

- Meal ID
- Tenant ID
- Date
- Meal type (breakfast, lunch, dinner, snack)
- Recipe ID (foreign key)
- Notes

**6. Recipes**

- Recipe ID
- Tenant ID
- Title
- Description
- Ingredients (JSON or separate table)
- Instructions
- Prep time
- Cook time
- Servings
- Image URL
- Dietary tags (vegetarian, gluten-free, etc.)

**7. Shopping Lists**

- List ID
- Tenant ID
- List name (groceries, household, etc.)
- Created by (user ID)

**8. Shopping Items**

- Item ID
- List ID (foreign key)
- Item name
- Quantity
- Category (produce, dairy, etc.)
- Checked (purchased flag)
- Added by (user ID)

**9. Rewards/Points**

- Transaction ID
- Tenant ID
- User ID
- Points earned/spent
- Reason (task completed, reward redeemed)
- Timestamp
- Related task/reward ID

**10. Photos**

- Photo ID
- Tenant ID
- Uploaded by (user ID)
- File path/URL
- Caption
- Upload date
- Album/folder
- Metadata (dimensions, file size)

### Data Retention

- **Active data:** Retained indefinitely while tenant active
- **Completed tasks:** Retain for 90 days (configurable)
- **Old calendar events:** Retain for 1 year (configurable)
- **Photos:** Retain until user deletion
- **Audit logs:** Retain for 1 year (compliance)

### Data Export

- Users can export all their data (GDPR compliance)
- Export formats: JSON, CSV
- Include all entities (events, tasks, photos, etc.)

### Data Backup

- **Phase 1:** Manual backups (user responsibility)
- **Phase 3:** Automated daily backups to cloud storage
- **Retention:** 30 days of daily backups, 12 months of monthly backups

-----

## Integration Requirements

### Calendar Integration

- Google Calendar (CalDAV)
- Apple iCloud Calendar (CalDAV)
- Microsoft Outlook/Office 365 (CalDAV or Graph API)
- Two-way sync (read and write)

### Weather Integration

- OpenWeatherMap API (free tier: 1,000 calls/day)
- Or Weather.gov API (free, US only)

### Recipe Integration (Phase 2)

- Spoonacular API or similar
- Or web scraping with user consent

### Smart Home Integration (Phase 2)

- Home Assistant API
- Apple HomeKit
- Google Home
- Amazon Alexa

### NHS App Integration (Nice-to-Have)

- NHS App deep links (URL scheme)
- Email parsing for appointment confirmations
- Future: Official NHS API (requires NHS Digital approval)

-----

## User Stories

### As a Parent (Admin)

- I want to see the entire family's schedule at a glance so I can coordinate activities
- I want to assign chores to my children so household tasks are distributed
- I want to track task completion so I know who's doing their responsibilities
- I want to plan meals for the week so grocery shopping is efficient
- I want to add items to a shared shopping list so nothing is forgotten
- I want to set kitchen timers so cooking is easier
- I want to see family photos during idle time so our home feels personal
- I want to manage user permissions so children see age-appropriate content
- I want to export our data so I'm not locked into the system

### As a Child (Age 10)

- I want to see my chores for the day so I know what's expected
- I want to mark tasks as complete so I can earn points
- I want to see my point total so I know how close I am to rewards
- I want to see the family schedule so I know what's happening
- I want to set a timer so I remember when to come back inside
- I want to see photos of our family so I feel connected

### As a Beta Tester (Friend/Family)

- I want to try the system with my own family so I can provide feedback
- I want my data completely separate from other families so privacy is maintained
- I want to report bugs easily so the system improves

### As a Future Paying Customer

- I want a cloud-hosted option so I don't need to manage hardware
- I want mobile access so I can update from anywhere
- I want reliable uptime so my family can depend on it
- I want responsive support so issues are resolved quickly

-----

## Success Criteria

### Phase 1 Success

- System running on Raspberry Pi in home
- Family actively using calendar, tasks, and meal planning
- Stable operation for 30+ days without intervention
- Positive family feedback on usability
- Core features (calendar sync, tasks, meals) working reliably

### Phase 2 Success

- 5-10 beta testers using system as separate tenants
- Feedback incorporated, bugs fixed
- Mobile PWA functional and used regularly
- Multi-tenancy proven secure and stable

### Phase 3 Success (Commercial)

- 100+ paying customers
- 99.9% uptime achieved
- Revenue exceeds infrastructure costs
- Positive customer reviews/testimonials
- Feature parity with commercial competitors

-----

## Risks & Mitigations

### Technical Risks

**Risk:** Raspberry Pi hardware failure
**Impact:** High (system unavailable)
**Mitigation:**

- Keep spare Pi on hand
- Automated backups to cloud
- Documentation for quick recovery

**Risk:** Calendar sync reliability issues
**Impact:** Medium (core feature degraded)
**Mitigation:**

- Extensive testing with multiple providers
- Manual add/edit fallback
- Clear error messages and retry logic

**Risk:** Database performance at scale
**Impact:** Medium (affects Phase 3)
**Mitigation:**

- Proper indexing from day one
- Query optimization
- Load testing before scaling
- Option to upgrade database tier

**Risk:** Security vulnerability
**Impact:** Critical (data breach)
**Mitigation:**

- Security-first design (encryption, HTTPS, RBAC)
- Regular security updates
- Penetration testing (Phase 3)
- Bug bounty program (Phase 3)

### Business Risks (Phase 3)

**Risk:** Low market adoption
**Impact:** High (commercial failure)
**Mitigation:**

- Validate with beta testers first
- Competitive pricing
- Clear value proposition vs. competitors
- Open-source foundation builds trust

**Risk:** Competitive pressure (Skylight, etc.)
**Impact:** Medium
**Mitigation:**

- Differentiate on privacy, customization, cost
- Open-source moat (community contributors)
- Dual model (self-hosted + cloud)

**Risk:** Regulatory compliance (GDPR, data protection)
**Impact:** High (legal issues)
**Mitigation:**

- Privacy by design
- Data export/deletion features
- Clear terms of service
- Legal review before commercial launch

-----

## Out of Scope (Current Project)

### Explicitly NOT Included

- Native mobile apps (iOS/Android) - PWA sufficient initially
- Video calling/communication features
- Social media integration beyond calendar sync
- Multi-language support (English only initially)
- Accessibility features beyond basic contrast/font size
- Advanced AI features (recommendations, predictions)
- Integration with school/work systems (Google Classroom, Slack, etc.)
- Inventory management (pantry tracking, expiration dates)
- Budget/finance tracking
- Pet care tracking
- Vehicle maintenance tracking

These may be considered for future phases based on user feedback and demand.

-----

## Appendices

### A. Work Tech Stack (Airedale Group)

For reference and alignment considerations:

- Languages: C#, Java, JavaScript
- Frameworks: Blazor, MAUI, .NET
- Design Systems: Ant Design, Ant Design Blazor
- Infrastructure: Azure, Docker, AKS
- Databases: SQL Server, Cosmos DB
- CI/CD: Azure DevOps Pipelines
- Source Control: Bitbucket, Azure DevOps

### B. Glossary

- **Tenant:** A family unit using the system (multi-tenancy concept)
- **CalDAV:** Calendar Data protocol for syncing calendars
- **PWA:** Progressive Web App (web app that works like native app)
- **JWT:** JSON Web Token (authentication mechanism)
- **RBAC:** Role-Based Access Control (permissions system)
- **SaaS:** Software as a Service (cloud-hosted software)
- **GDPR:** General Data Protection Regulation (EU privacy law)
- **Monolith:** Single application architecture (vs. microservices)

### C. Reference Links

- Ant Design: https://ant.design/
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/
- Docker: https://www.docker.com/
- CalDAV: https://en.wikipedia.org/wiki/CalDAV

-----

**Document Version:** 1.0
**Last Updated:** October 6, 2025
**Next Review:** After Phase 1 completion
**Owner:** James Brown
