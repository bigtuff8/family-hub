# Calendar Views Testing Guide

## Quick Start

1. **Start the application**:
   ```bash
   cd /c/projects/familyhub/family-hub
   # Start backend (if not running)
   cd backend && python -m uvicorn app.main:app --reload
   # Start frontend (in another terminal)
   cd frontend && npm start
   ```

2. **Navigate to Calendar**: The calendar feature should load automatically with the new Month view.

## Testing Scenarios

### 1. Month View Testing
- [ ] Verify calendar grid displays current month
- [ ] Check that events appear in correct date cells
- [ ] Verify event colors match family members (James=red, Nicola=pink, Tommy=green, Harry=blue)
- [ ] Click on an event - should open EventDetailsModal
- [ ] Click on a date - should open CalendarEventForm to create new event
- [ ] Click "Previous" - should navigate to previous month
- [ ] Click "Next" - should navigate to next month
- [ ] Click "Today" - should jump back to current month
- [ ] Verify "Today" date is highlighted in teal
- [ ] Check that days outside current month are dimmed
- [ ] Verify "+X more" appears when more than 3 events per day
- [ ] Resize window to <768px - verify mobile responsive layout

### 2. Week View Testing
- [ ] Click "Week" tab to switch to week view
- [ ] Verify 7-day grid displays (Sun-Sat)
- [ ] Check time slots show 7am-10pm
- [ ] Verify all-day events appear at top
- [ ] Check timed events appear in correct hour slots
- [ ] Verify event colors match family members
- [ ] Click on an event - should open EventDetailsModal
- [ ] Click "Previous" - should navigate to previous week
- [ ] Click "Next" - should navigate to next week
- [ ] Click "Today" - should jump to current week
- [ ] Verify current day column is highlighted
- [ ] Check grid is scrollable vertically
- [ ] Resize window to <768px - verify horizontal scroll works

### 3. Day View Testing
- [ ] Click "Day" tab to switch to day view
- [ ] Verify large header shows day name, date, month
- [ ] Check all-day events section displays at top
- [ ] Verify timed events appear in hourly slots
- [ ] Check event details are visible (time, title, location, description)
- [ ] Verify event colors match family members
- [ ] Click on an event - should open EventDetailsModal
- [ ] Click "Previous" - should navigate to previous day
- [ ] Click "Next" - should navigate to next day
- [ ] Click "Today" - should jump to current day
- [ ] Verify "Today" has teal highlighting
- [ ] Check grid is scrollable vertically
- [ ] Resize window to <768px - verify mobile layout

### 4. Event Details Modal Testing
- [ ] Click any event to open modal
- [ ] Verify all event details display correctly:
  - Title with color-coded header
  - Date and time
  - Event lead (family member)
  - Location
  - Description
- [ ] Click "Edit" button - should open CalendarEventForm in edit mode
- [ ] Make changes and save - should update event and refresh view
- [ ] Click "Delete" button - should show confirmation dialog
- [ ] Confirm delete - should remove event and refresh view
- [ ] Click "Close" button - should close modal
- [ ] Resize window to <768px - verify mobile layout with full-width buttons

### 5. Navigation Testing
- [ ] In Month view, click Previous/Next - date range updates correctly
- [ ] Switch to Week view - should preserve selected date
- [ ] Click Previous/Next in Week - date range updates correctly
- [ ] Switch to Day view - should preserve selected date
- [ ] Click Previous/Next in Day - date updates correctly
- [ ] Click "Today" in each view - should jump to current date
- [ ] Verify date range display updates correctly in header

### 6. Create Event Testing
- [ ] Click "Add Event" button - should open CalendarEventForm
- [ ] Fill in event details and save
- [ ] Verify new event appears in all three views
- [ ] In Month view, click a date - should open form with that date pre-filled
- [ ] Create event and verify it appears

### 7. View Toggle Testing (Desktop Only)
- [ ] Look for toggle buttons in top-right corner
- [ ] Click "Dashboard" button - should switch to legacy dashboard view
- [ ] Click "Calendar" button - should switch back to new calendar views
- [ ] Verify toggle is hidden on mobile (<768px)

### 8. Integration Testing
- [ ] Create an event in Month view
- [ ] Switch to Week view - event should appear
- [ ] Switch to Day view - event should appear
- [ ] Edit event from Day view
- [ ] Switch back to Month view - changes should be reflected
- [ ] Delete event from Week view
- [ ] Switch to Day view - event should be gone

### 9. Mobile Responsive Testing
Resize browser to <768px or test on mobile device:
- [ ] Month view: simplified grid, smaller text
- [ ] Week view: horizontal scrollable columns
- [ ] Day view: optimized vertical layout
- [ ] Event details modal: full-width buttons
- [ ] Header: stacked layout with centered controls
- [ ] All buttons remain accessible and usable

### 10. Error Handling
- [ ] Check browser console for errors
- [ ] Verify no TypeScript compilation errors
- [ ] Test with no events - should display empty calendars
- [ ] Test with many events - should handle overflow correctly

## Expected Behavior

### Color Coding
Events should be color-coded by the event lead (family member):
- James events: Red border (#e30613)
- Nicola events: Pink border (#fb7185)
- Tommy events: Green border (#00B140)
- Harry events: Blue border (#1D428A)
- Unassigned events: Teal border (#2dd4bf)

### Timezone
All times should display in Europe/London timezone (handles BST/GMT automatically).

### Responsive Breakpoint
Mobile layout activates at window width < 768px.

## Common Issues & Solutions

### Issue: Events not appearing
- **Solution**: Check that events have dates within the visible range (current month ± 1 month)

### Issue: Times are off by 1 hour
- **Solution**: This is the BST/GMT offset - verify events are stored in UTC

### Issue: Modal not opening
- **Solution**: Check browser console for errors, ensure event has valid ID

### Issue: TypeScript errors
- **Solution**: Run `npm install` to ensure all dependencies are installed

### Issue: Styles not applying
- **Solution**: Ensure all CSS files are imported, check browser dev tools

## Success Criteria

✅ All three views (Month, Week, Day) display correctly
✅ Events appear in all views with correct colors
✅ Navigation works in all views
✅ Event details modal opens and displays information
✅ Create, edit, and delete operations work
✅ View switching preserves selected date
✅ Mobile responsive design works
✅ No console errors
✅ No TypeScript compilation errors
✅ Backward compatibility with dashboard view maintained

## Next Steps

After testing:
1. Report any bugs or issues found
2. Request additional features if needed
3. Deploy to production when ready
4. Consider future enhancements (drag-and-drop, search, filters, etc.)

---

**Happy Testing!** 🎉
