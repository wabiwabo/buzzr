# Enterprise Dashboard & Issue/Request Management UI Research

> Research compiled 2026-03-08. Analysis of Linear, GitHub Issues, Zendesk, Datadog, and Stripe dashboard patterns with focus on operator fatigue reduction and high-volume request management.

---

## Table of Contents

1. [Linear](#1-linear)
2. [GitHub Issues & Projects](#2-github-issues--projects)
3. [Zendesk Agent Workspace](#3-zendesk-agent-workspace)
4. [Datadog](#4-datadog)
5. [Stripe Dashboard](#5-stripe-dashboard)
6. [Cross-Cutting UX Patterns](#6-cross-cutting-ux-patterns)
7. [Operator Fatigue Reduction Patterns](#7-operator-fatigue-reduction-patterns)
8. [Recommendations for Buzzr](#8-recommendations-for-buzzr)
9. [Sources](#9-sources)

---

## 1. Linear

### Layout Structure

- **Inverted L-shape chrome**: Global sidebar (left) + top navigation bar controlling the main content area.
- Sidebar, tabs, headers, and panels are tuned to reduce visual noise while maintaining clear visual alignment and increasing hierarchy density.
- The current view, available actions, and meta properties are presented with clear separation.
- Uses the **LCH color space** for theme generation (perceptually uniform across hues), reduced from 98 theme variables to just 3 (base color, accent color, contrast).

### Issue List Design

- **Multiple layouts**: List, Board, Timeline views selectable per-view.
- **Grouping**: Issues can be grouped by Status, Assignee, Project, Priority, Cycle, or Focus. Sub-grouping supported for swim-lane structures.
- **Ordering**: By Status, Manual, Priority, Last created, Last updated, Due date, Link count.
- **Display properties** (toggleable per item): Issue ID, Priority, Status, Labels, Project, Cycle, Created, Updated, Assignee, Estimate, Links, Time in status, Sentry issues, Pull Requests, Commits, SLA.
- Groups can display total issue count or estimated effort totals.
- Empty groups can be hidden/shown.

### Detail Panel Behavior

- **Peek Preview** (Space key): macOS Quicklook-style overlay that shows issue description, assignee, status, priority, cycle, labels, estimate, creation date, and updated date without navigating away from the list.
  - Toggle with single Space press, or hold Space for temporary peek.
  - Navigate between items with J/K or arrow keys while peek is active.
- **Full detail view**: Opens in-place, replacing the list view (not a sidebar split).
- **Command menu peek**: Right arrow in Cmd+K shows a preview panel alongside the command menu.

### Action Placement

- **Keyboard-first design** is foundational. Nearly every action is keyboard-accessible:
  - `C` = create issue, `A` = assign, `L` = add label, `P` = set priority, `F` = filter
  - `G then T` = go to Triage, `G then I` = go to Inbox, `G then M` = go to My Issues
  - `Cmd+K` = global command palette (contextual to current item)
  - `E` = archive inbox notification, `Shift+H` = snooze
  - `1` = Accept (triage), `2` = Mark as Duplicate, `3` = Decline, `H` = Snooze
  - `?` = keyboard shortcuts help overlay
- **Triage actions** are purpose-built: Accept, Mark as Duplicate, Decline, Snooze, Request Information.
- Triage Intelligence provides AI suggestions that blend into the standard visual language, with hover-to-reveal reasoning.

### Status Visualization

- Status icons are compact, color-coded dots/icons inline with issue rows.
- Priority uses colored icons (Urgent, High, Medium, Low, No Priority).
- Labels appear as small colored pills.
- SLA indicators on Business/Enterprise plans.

### Navigation Efficiency

- **Triage as a dedicated inbox**: Issues from integrations/external members land here first, keeping the main backlog clean.
- **Custom views**: Saved filter+display combinations.
- **Triage Rules**: Automated routing that can update team, status, assignee, label, project, and priority.
- **Triage Responsibility**: Designated rotation with PagerDuty/OpsGenie integration.

---

## 2. GitHub Issues & Projects

### Layout Structure

- **Three view types** per project, switchable per saved view:
  - **Table**: Spreadsheet-style with columns, inline editing, grouping, sorting.
  - **Board**: Kanban columns mapped to any single-select field (typically Status).
  - **Roadmap/Timeline**: Gantt-style visualization using date/iteration fields.

### Issue List Design (Table View)

- Full spreadsheet model: issues, PRs, and draft issues as rows; metadata + custom fields as columns.
- **Inline editing**: Click any cell to edit directly in the table.
- **Custom fields**: Iterations, priority, story points, dates, notes, links, single-select, number fields.
- **Field summation**: Number fields display aggregate sums in column headers and group headers.
- **Column management**: Show/hide, reorder by drag, resize.
- **Row reordering**: Manual drag by clicking row numbers.
- **Multi-level sorting**: Primary and secondary sort with directional toggles.
- **Grouping**: By any single-select/iteration field; dragging items between groups updates values automatically.
- **Slicing**: Separate panel for browsing by field values.
- **WIP limits** configurable on board columns.

### Detail Panel Behavior

- Clicking an issue opens a **full-page detail view** (not a sidebar).
- Sub-issues displayed in a dedicated section within the parent issue.
- Progress indicators show sub-issue completion status.
- Issue types enable classification (bug, feature, etc.) across repositories.

### Action Placement

- **"Create more" button** for rapid consecutive issue creation.
- **Batch creation** supported.
- **Filter bar** with autocomplete and syntax highlighting.
- **Advanced search**: AND/OR operators with nested parentheses.
- **Copy link** button on each issue.

### Status Visualization

- Custom status fields with colored labels.
- Sub-issue progress bars within parent issues.
- Milestone progress indicators.
- Label pills with custom colors.

### Navigation Efficiency

- **Saved views**: Each view can have its own layout, filters, grouping, and sort.
- **Issue types**: Organization-wide classification for consistent categorization.
- Available via web, CLI, and mobile apps.

---

## 3. Zendesk Agent Workspace

### Layout Structure

- **Unified ticket interface** consolidating email, chat, voice, social, and web messaging.
- **Three-panel layout**:
  - Left: Ticket list/navigation
  - Center: Conversation panel (chronological, newest at bottom)
  - Right: Context panel (toggleable) with customer context, knowledge base, side conversations, custom objects
- **Layout Builder** (drag-and-drop): Admins customize component placement, stacking, and sizing.
  - Components can be stacked vertically (up to 2 per column).
  - Resize by dragging handles.
  - Move between main layout and context panel.
  - Preview with real ticket data before deployment.
  - Multiple active layouts for different ticket types (Enterprise).
  - Undo/redo during editing.

### Ticket List Design

- **Views**: Pre-built and custom filtered lists of tickets.
- **SLA column** and **Group SLA column** showing the soonest expiring target.
- Filterable by email, card status, creation date, account type, delinquency status.
- Custom ticket statuses with colored visual indicators per status category.

### Detail Panel Behavior

- **Tabbed ticket interface**: Multiple tickets open as tabs at the top.
- Conversation thread is the primary focus area.
- Context panel slides in from the right.
- **Contextual Workspaces**: Different layouts auto-activate based on ticket criteria (brand, agent group, ticket form).

### Action Placement

- **Macros**: Pre-built action sequences accessible from the ticket interface.
- **Unified channel status menu**: Set availability across all channels from one control.
- **Call console** at the top of the interface for inline voice management.
- **Notification hub** at the top for messaging/chat alerts.
- Intelligent Triage displays intent and sentiment in the ticket header.

### SLA Visualization

- **Color-coded countdown badges**:
  - Green: > 15 minutes remaining
  - Amber: < 15 minutes remaining
  - Red: 0 minutes (breached), shows negative values like "-15m"
- Paused targets show pause icon (green if not breached, red if breached).
- Hover reveals all active SLA targets and exact breach date/time.
- Badges round to nearest minute, hour, or day.
- Priority-driven: SLA requires priority to determine countdown target.

### Navigation Efficiency

- Channel-agnostic: Agents swap between chat, email, voice within one ticket.
- Contextual workspaces simplify forms and macros based on ticket type.
- Knowledge base search integrated in context panel.

---

## 4. Datadog

### Dashboard Layout

- **12-column responsive grid** that scales to any screen size.
- Widgets auto-snap, auto-align, and auto-resize.
- **High Density Mode**: On wide screens, dashboard halves display side-by-side, maximizing real estate.
- Adjacent widgets can be swapped by dragging one atop another.
- **Widget grouping**: Shift+Click or lasso selection, then Cmd+G. Groups are resizable, copyable, collapsible. Partial-width groups allow adjacent clusters.
- Color-coded group headers for visual organization.

### Monitor List Design

- **Faceted sidebar navigation**: Ranked breakdowns by service, monitor type, notification channel, status.
- **Search bar** with attribute-based queries (e.g., `status:alert type:integration`).
- **Bulk operations**: Checkbox selection (individual + select-all), then tag, mute, resolve in batch.
- **Multi-edit**: Tag several monitors at once.
- Performance optimized for organizations with large monitor inventories.

### Incident Management UI

- **Incident Details page** with global header containing Status and Severity selectors.
- **Dynamic dashboards** within incident view for real-time data visualization.
- **Interactive timeline** tracking chronological sequence of events.
- **Filterable properties panel** (left side): Status, Severity, Time To Repair.
- **Incident Analytics**: Aggregate statistics (time to resolution, customer impact) queryable via dashboard widgets.
- **Status Pages** integration: Publish status updates directly from incident management (no context switching).
- Severity and status levels are customizable per organization.

### Real-Time Visualization

- Individual widgets can operate on different timeframes for cross-period correlation.
- Template variables for dynamic filtering across services/environments/teams.
- **Monitor Summary Widget**: Shows count of monitors per status, list of monitors, or both.
- All standard widget types supported: Timeseries, Heatmaps, Log streams, Geomaps.

### Action Placement

- Delete widgets via keyboard (Delete key) with instant Cmd+Z undo.
- Copy/paste widgets between dashboards (Cmd+C/Cmd+V).
- Datadog clipboard (Cmd+Shift+K).
- Widget sizing guidelines: Timeseries min 4 columns, Streams min 6 columns.

---

## 5. Stripe Dashboard

### Layout Structure

- **Sidebar-based primary navigation** with hierarchical organization:
  - Core section: Home, Balances, Transactions, Customers, Product catalog
  - Products section: Payments, Billing, Reporting, Connect, + expandable "More" menu
- **Shortcuts/Pins**: Users pin frequently visited pages for quick access.
- **Recently visited pages** shown in navigation.
- Sidebar has been deliberately minimized to reduce link count.

### Data Table Design

- **Searchable, sortable tables** showing key columns (ID, date, amount, status).
- **Filterable**: By email, card status, creation date, account type, delinquency status, etc.
- **Export capability** for offline analysis.
- Transactions view supports inline task actions (refund, send invoice, view customer).

### Detail Panel Behavior

- **Click-through to full detail page**: Clicking a customer/payment opens a dedicated detail view.
- Detail pages show related entities: subscriptions, payments, payment methods, invoices, quotes.
- **Not a sidebar split** -- uses full-page navigation with breadcrumb back-navigation.

### Action Placement

- **Context-sensitive actions**: Actions appear relevant to the current view.
- **Home page surfaces urgent items**: Unresolved disputes, notifications.
- **Customizable widgets** on home page (add/remove for personalized view).
- **Keyboard shortcuts** available (? to view shortcut list).
- **Workbench**: API request logging with success/failure tracking.

### Status Visualization

- **Progress tracking** patterns for multi-step processes.
- **Loading states** and **empty states** clearly communicated.
- **Connection feedback** screens during external service interactions.
- Business metrics as chart widgets on home page.

---

## 6. Cross-Cutting UX Patterns

### Master-Detail Interaction Models

| Pattern | Used By | Best For |
|---------|---------|----------|
| **Peek/Quick Look** (overlay on hover/keypress) | Linear | Rapid scanning without context loss |
| **Side Panel** (persistent right panel) | Zendesk | Multi-tasking with list visible |
| **Full Page Detail** | GitHub, Stripe | Deep investigation with complex sub-content |
| **Split View** (50/50 side-by-side) | Zendesk (configurable) | Continuous triage workflows |
| **In-Place Expansion** (expandable rows) | Data tables generally | Quick edits on simple records |

**Key insight**: The best tools offer multiple modes. Linear provides peek for scanning, full view for deep work. Zendesk lets admins configure the split ratio. The pattern should match the task depth.

### Command Palette (Cmd+K)

Universal across modern enterprise tools (Linear, Stripe, GitHub, Slack, Notion, VS Code):
- Triggered by `Cmd+K` or `Ctrl+K`
- Combines search + command execution in one interface
- Contextual to current view/selection
- Supports fuzzy matching
- Categories: Navigation, Actions, Recent items
- Best for: Complex apps with many features, power users, keyboard-first workflows

### Bulk Actions

Consistent pattern across all researched tools:
1. **Checkbox selection** (individual + select-all) in leftmost column
2. **Contextual toolbar appears** immediately upon selection, persists during scroll
3. **Selection count** displayed prominently
4. **Action bar placement**: Above the table or as a sticky bar
5. **Destructive actions** require confirmation modal
6. **Non-destructive actions** provide undo via toast notification
7. **Progress feedback**: Spinner during execution, success/failure count after
8. **Target size**: 24x24px minimum for desktop checkboxes

### Filtering & Saved Views

- **Faceted sidebar** (Datadog) for dimension-based drill-down
- **Filter bar with autocomplete** (GitHub, Linear) for query building
- **AND/OR logic with nesting** (Linear, GitHub) for complex queries
- **Saved views** persist layout + filters + grouping + sort (all tools)
- **Template variables** (Datadog) for dynamic parameterized views

### Status & Priority Visualization

| Element | Pattern | Examples |
|---------|---------|----------|
| **Status** | Colored dot/icon + label | Linear (dot), GitHub (label pill), Zendesk (colored indicator) |
| **Priority** | Icon with color gradient | Linear (Urgent=red, High=orange, Medium=yellow, Low=blue) |
| **SLA** | Countdown badge with color transition | Zendesk (green > amber > red) with negative time display |
| **Severity** | Selectable dropdown in header | Datadog (customizable levels) |
| **Progress** | Inline progress bar | GitHub (sub-issue completion), Datadog (incident timeline) |
| **Labels** | Colored pills/tags | All tools |

---

## 7. Operator Fatigue Reduction Patterns

### Information Architecture

1. **Progressive disclosure**: Show summary by default, reveal details on interaction (tooltips, expand, drill-down). Never show everything at once.
2. **F-pattern and Z-pattern layout**: Place critical data in top-left. Structure related information top-to-bottom by importance.
3. **Orientation zone**: Clear page titles, descriptions, and section groupings so operators immediately understand context and available actions.
4. **Meaningful defaults**: Pre-fill fields, auto-select common values, provide smart suggestions. Reduce steps from 8-10 clicks to 2-3.

### Visual Design for Sustained Use

5. **Restrained color usage**: Use color intensity scales (light to dark) for hierarchy, not rainbow palettes. Blues for positive, oranges for negative. Avoid "trading terminal" aesthetic.
6. **Perceptually uniform color spaces**: Linear uses LCH instead of HSL so a red and yellow at lightness 50 appear equally light to the human eye.
7. **High contrast for readability**: Darker text/icons in light mode, lighter in dark mode. Support automatic high-contrast themes.
8. **Consistent element placement**: Every control in the same position across views reduces scanning effort.
9. **Non-color indicators**: Pair color with icons/labels for color-blind accessibility and redundant encoding.

### Interaction Efficiency

10. **Keyboard-first navigation**: Single-key shortcuts for common actions (Linear's `C`, `A`, `L`, `P`). Multi-key sequences for navigation (`G then T`).
11. **Command palette**: Universal `Cmd+K` for search + actions. Contextual to current view.
12. **Inline editing**: Edit values directly in table cells without opening modals (GitHub Projects).
13. **Batch/bulk operations**: Select multiple items, apply actions at once. Critical for high-volume environments.
14. **Triage-specific workflows**: Dedicated views with accept/decline/snooze/duplicate actions (Linear). Not just generic status changes.

### Cognitive Load Management

15. **Role-specific views**: Surface only information and actions relevant to the operator's role. Leaders see summaries; operators see task queues.
16. **Contextual workspaces**: Auto-switch layout/available actions based on content type (Zendesk).
17. **Triage Intelligence / AI suggestions**: AI-powered property suggestions, duplicate detection, automated routing (Linear, Zendesk).
18. **Dashboard fatigue prevention**: Fewer dashboards with focused intent > many dashboards with overlapping data. Use template variables for reusable views.
19. **Comparison baselines**: Always show deltas, averages, and targets alongside raw numbers. Cognitive landmarks ground interpretation.

### Real-Time & Scale

20. **SLA countdown visualization**: Color-transitioning badges with exact breach times (Zendesk). Agents prioritize without mental math.
21. **Real-time status without noise**: Update indicators in-place rather than pushing notifications for every change. Use polling intervals appropriate to urgency.
22. **Responsive grid layouts**: 12-column grids that adapt to screen size (Datadog). High-density mode for wide screens.
23. **Performance at scale**: Faceted search with ranked results (Datadog). Optimized for large inventories. Lazy loading and pagination.

---

## 8. Recommendations for Buzzr

Based on research findings, the following patterns are most applicable to a waste management platform handling citizen complaints, pickup requests, driver assignments, and operational monitoring:

### High-Priority Patterns

1. **Triage inbox for incoming complaints/requests**: Dedicated view (modeled on Linear's Triage) where new citizen complaints and pickup requests land before entering workflow. Operators accept, decline, assign, or snooze. Keyboard shortcuts `1/2/3/H` for rapid processing.

2. **Split-pane layout for complaint triage**: Left panel shows complaint/request list with key columns (ID, type, priority, SLA countdown, location, status). Right panel shows selected item details (description, photos, location map, citizen info, history). Configurable split ratio (Zendesk model).

3. **SLA countdown badges**: Color-coded countdown timers on each complaint/request showing time remaining before SLA breach. Green > Amber (< 15 min) > Red (breached). Critical for DLH compliance tracking.

4. **Command palette (Cmd+K)**: Global search + action execution. Search complaints by ID/citizen/location. Quick actions: assign driver, change status, add note. Contextual to current view.

5. **Bulk actions toolbar**: Select multiple complaints/requests, then batch-assign to driver, batch-update status, batch-add labels. Checkbox selection with sticky action bar.

### Medium-Priority Patterns

6. **Saved views per role**: DLH Admin sees all complaints grouped by district. TPS Operator sees pickup queue sorted by priority. Driver sees assigned routes. Sweeper sees zone assignments.

7. **Faceted sidebar filters**: Filter by waste category, complaint category, status, priority, district, date range. Show result counts per facet value.

8. **Real-time operational dashboard**: 12-column responsive grid with widgets for active complaints by status, SLA breach rate, driver positions (map), daily collection volume. High-density mode for control room screens.

9. **Keyboard navigation**: `J/K` for list navigation, `Space` for peek preview (show complaint details + photos without navigating), single-key shortcuts for status changes.

10. **Progressive disclosure**: Complaint list shows ID, type, priority, status, location, SLA. Peek shows description + photos. Full view shows complete history, assignment chain, citizen profile, related complaints.

### Lower-Priority (Future) Patterns

11. **AI-powered triage suggestions**: Auto-categorize complaints, suggest assignee based on location/workload, detect duplicates.

12. **Contextual workspaces**: Auto-switch layout when viewing complaints vs. monitoring vs. payment management.

13. **Timeline/Roadmap view**: For scheduled pickups and collection route planning.

14. **Custom fields per tenant**: Allow each DLH to add tenant-specific metadata fields to complaints/requests.

---

## 9. Sources

### Linear
- [How we redesigned the Linear UI (part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Triage - Linear Docs](https://linear.app/docs/triage)
- [Display options - Linear Docs](https://linear.app/docs/display-options)
- [Filters - Linear Docs](https://linear.app/docs/filters)
- [Peek preview - Linear Docs](https://linear.app/docs/peek)
- [Board layout - Linear Docs](https://linear.app/docs/board-layout)
- [How we built Triage Intelligence](https://linear.app/now/how-we-built-triage-intelligence)
- [Linear keyboard shortcuts](https://keycombiner.com/collections/linear/)
- [Linear shortcuts - Shortcuts.design](https://shortcuts.design/tools/toolspage-linear/)

### GitHub Issues & Projects
- [About Projects - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [Customizing the table layout - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-table-layout)
- [Customizing the board layout - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-board-layout)
- [Customizing the roadmap layout - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/customizing-the-roadmap-layout)
- [Evolving GitHub Issues (public preview)](https://github.blog/changelog/2025-01-13-evolving-github-issues-public-preview/)
- [GitHub Issues features](https://github.com/features/issues)
- [Best practices for Projects - GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects)

### Zendesk
- [About the Zendesk Agent Workspace](https://support.zendesk.com/hc/en-us/articles/4408821259930-About-the-Zendesk-Agent-Workspace)
- [Creating custom layouts to improve agent workflow](https://support.zendesk.com/hc/en-us/articles/5447837546138-Creating-custom-layouts-to-improve-agent-workflow)
- [Viewing and understanding SLA targets](https://support.zendesk.com/hc/en-us/articles/4408832852122-Viewing-and-understanding-SLA-targets)
- [Setting up contextual workspaces](https://support.zendesk.com/hc/en-us/articles/4408833498906-Setting-up-contextual-workspaces)
- [About intelligent triage](https://support.zendesk.com/hc/en-us/articles/4964463770650-About-intelligent-triage-and-Intelligence-in-the-context-panel)
- [Defining SLA policies](https://support.zendesk.com/hc/en-us/articles/4408829459866-Defining-and-using-SLA-policies)

### Datadog
- [Datadog Dashboards blog post](https://www.datadoghq.com/blog/datadog-dashboards/)
- [Getting Started with Dashboards](https://docs.datadoghq.com/getting_started/dashboards/)
- [Manage Monitors](https://docs.datadoghq.com/monitors/manage/)
- [Search, filter, and find monitors faster](https://www.datadoghq.com/blog/manage-monitors/)
- [Manage dashboards and monitors at scale](https://www.datadoghq.com/blog/dashboards-monitors-at-scale/)
- [Incident Management](https://docs.datadoghq.com/monitors/incident_management/)
- [Effective Dashboards repository](https://github.com/DataDog/effective-dashboards)

### Stripe
- [Web Dashboard basics - Stripe Documentation](https://docs.stripe.com/dashboard/basics)
- [Design patterns for Stripe Apps](https://docs.stripe.com/stripe-apps/patterns)
- [UI components - Stripe Documentation](https://docs.stripe.com/stripe-apps/components)
- [Stripe Payments Dashboard UI Design - SaaSFrame](https://www.saasframe.io/examples/stripe-payments-dashboard)

### General UX Research
- [Enterprise UX Design Guide 2026 - FuseLab Creative](https://fuselabcreative.com/enterprise-ux-design-guide-2026-best-practices/)
- [Enterprise UX Design Best Practices - UXPilot](https://uxpilot.ai/blogs/enterprise-ux-design)
- [Dashboard UX Patterns Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Enterprise UX: resources for complex data tables - Stephanie Walter](https://stephaniewalter.design/blog/essential-resources-design-complex-data-tables/)
- [Bulk actions UX: 8 design guidelines - Eleken](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [Cognitive overload in UX - Toptal](https://www.toptal.com/designers/ux/cognitive-overload-burnout-ux)
- [Minimize Cognitive Load - NN/g](https://www.nngroup.com/articles/minimize-cognitive-load/)
- [HMI Design for Operator Workload - Aufait UX](https://www.aufaitux.com/blog/ux-hmi-design-operator-workload-best-practices/)
- [Command Palette UX Patterns](https://www.hashbuilds.com/patterns/what-is-command-palette)
- [Master-Detail UI Pattern Design](https://webapphuddle.com/master-detail-ui-pattern-design/)
- [Bulk selection - PatternFly](https://www.patternfly.org/patterns/bulk-selection/)
- [Master-Detail interface - Wikipedia](https://en.wikipedia.org/wiki/Master%E2%80%93detail_interface)
