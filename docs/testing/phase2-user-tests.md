# Phase 2 User Tests - Contacts & Smart Lookup

**Version:** 1.0
**Date:** December 2024
**Scope:** User-owned contacts, Publish to Family, Smart Lookup, SmartContactSearch

---

## Prerequisites

Before testing, ensure:
1. Backend is running: `docker-compose up` or `uvicorn main:app --reload`
2. Frontend is running: `npm run dev`
3. Database is seeded: `python seed.py`
4. You have access to multiple user accounts (James, Nicola, Tommy, Harry)

---

## Test Suite 1: Contacts Ownership (Browser)

### Test 1.1: View My Contacts Only

**Steps:**
1. Log in as **James** (jamesbrownyork8@gmail.com)
2. Navigate to Contacts page
3. Click "My Contacts" tab/filter

**Expected Results:**
- [ ] Only contacts owned by James are displayed
- [ ] Each contact shows ownership indicator (your contact)
- [ ] Total count reflects only James's contacts
- [ ] Family contacts (owned by Nicola, Tommy, Harry) are NOT shown

---

### Test 1.2: View Family Contacts

**Steps:**
1. Log in as **James**
2. Navigate to Contacts page
3. Click "Family Contacts" tab/filter

**Expected Results:**
- [ ] Only contacts published to family by OTHER family members are shown
- [ ] James's contacts (even if published) are NOT shown here
- [ ] Each contact shows who shared it (e.g., "Shared by Nicola")
- [ ] Contacts are read-only (no edit/delete buttons)

---

### Test 1.3: View All Contacts

**Steps:**
1. Log in as **James**
2. Navigate to Contacts page
3. Click "All Contacts" tab/filter

**Expected Results:**
- [ ] Both "My Contacts" AND "Family Contacts" are displayed
- [ ] Clear visual distinction between owned vs shared contacts
- [ ] Own contacts show edit/delete options
- [ ] Family contacts are view-only

---

### Test 1.4: Create New Contact

**Steps:**
1. Log in as **James**
2. Navigate to Contacts page
3. Click "Add Contact" button
4. Fill in contact details:
   - First Name: "Test Contact"
   - Last Name: "One"
   - Email: "test1@example.com"
   - Phone: "07700 900001"
5. Save the contact

**Expected Results:**
- [ ] Contact is created successfully
- [ ] Contact appears in "My Contacts" view
- [ ] Contact shows James as owner
- [ ] "Publish to Family" toggle is OFF by default
- [ ] Contact does NOT appear in other users' "Family Contacts"

---

### Test 1.5: Edit Own Contact

**Steps:**
1. Log in as **James**
2. Navigate to Contacts > My Contacts
3. Find a contact you created
4. Click Edit
5. Change the last name to "Updated"
6. Save

**Expected Results:**
- [ ] Edit form opens with existing data populated
- [ ] Save is successful
- [ ] Updated data reflects immediately in contact list
- [ ] Updated timestamp is refreshed

---

### Test 1.6: Cannot Edit Family Contact

**Steps:**
1. Log in as **James**
2. Navigate to Contacts > Family Contacts
3. Attempt to edit a contact shared by Nicola

**Expected Results:**
- [ ] Edit button is NOT visible/available
- [ ] If attempting via URL manipulation, API returns 403 Forbidden
- [ ] Error message: "You don't have permission to edit this contact"

---

### Test 1.7: Delete Own Contact

**Steps:**
1. Log in as **James**
2. Navigate to Contacts > My Contacts
3. Find a test contact
4. Click Delete
5. Confirm deletion

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] Contact is removed from list after confirmation
- [ ] Contact no longer appears in any view
- [ ] If was published, removed from family members' views too

---

## Test Suite 2: Publish to Family (Browser)

### Test 2.1: Publish Contact to Family

**Steps:**
1. Log in as **James**
2. Navigate to Contacts > My Contacts
3. Open a contact you own
4. Toggle "Publish to Family" ON
5. Save/Confirm

**Expected Results:**
- [ ] Toggle updates successfully
- [ ] Success message: "Contact shared with family"
- [ ] Contact still appears in your "My Contacts"
- [ ] Log in as **Nicola** - contact now appears in "Family Contacts"
- [ ] Published timestamp is set

---

### Test 2.2: Unpublish Contact from Family

**Steps:**
1. Log in as **James**
2. Navigate to Contacts > My Contacts
3. Open a published contact
4. Toggle "Publish to Family" OFF
5. Confirm

**Expected Results:**
- [ ] Toggle updates successfully
- [ ] Success message: "Contact removed from family sharing"
- [ ] Contact remains in your "My Contacts"
- [ ] Log in as **Nicola** - contact NO LONGER appears in "Family Contacts"

---

### Test 2.3: Published Contact Shows Owner

**Steps:**
1. Log in as **James**
2. Create and publish a contact named "James Test Contact"
3. Log out
4. Log in as **Nicola**
5. Navigate to Family Contacts

**Expected Results:**
- [ ] "James Test Contact" appears in Nicola's Family Contacts
- [ ] Shows "Shared by James" label
- [ ] James's color indicator is visible (if applicable)
- [ ] No edit/delete options available to Nicola

---

## Test Suite 3: Smart Lookup API (Browser DevTools)

### Test 3.1: Search Returns Family Users First

**Steps:**
1. Log in as **James**
2. Open browser DevTools > Network tab
3. Navigate to event creation (or trigger smart lookup)
4. Search for "Nicola"
5. Inspect the `/contacts/lookup` response

**Expected Results:**
- [ ] API returns 200 OK
- [ ] Results array has family_user type first
- [ ] Nicola appears as type: "family_user"
- [ ] Response includes: id, display_name, email, color, role, is_minor

---

### Test 3.2: Search Returns Personal Contacts Second

**Steps:**
1. Log in as **James**
2. Ensure James has a personal contact named "John Smith"
3. Search for "John"
4. Inspect the `/contacts/lookup` response

**Expected Results:**
- [ ] After any family user matches, personal contacts appear
- [ ] Contact shows type: "contact", source: "personal"
- [ ] No owner_name (since it's your own contact)

---

### Test 3.3: Search Returns Family Contacts Third

**Steps:**
1. Log in as **Nicola**
2. Create and publish a contact named "Family Friend"
3. Log out
4. Log in as **James**
5. Search for "Family Friend"

**Expected Results:**
- [ ] Contact appears with type: "contact", source: "family"
- [ ] Shows owner_name: "Nicola"
- [ ] Appears after personal contacts in results

---

### Test 3.4: Email Suggestion for Unknown Address

**Steps:**
1. Log in as **James**
2. Search for "newperson@example.com"
3. Inspect the `/contacts/lookup` response

**Expected Results:**
- [ ] Results include email_suggestion type
- [ ] email: "newperson@example.com"
- [ ] prompt: "Invite newperson@example.com as guest"
- [ ] Appears last in results

---

### Test 3.5: Mixed Results Priority

**Steps:**
1. Set up data:
   - Family user: Tommy Brown
   - Personal contact: Tom Wilson
   - Family contact (from Nicola): Tommy Hilfiger
2. Search for "Tom"
3. Check results order

**Expected Results:**
- [ ] Order: Family users → Personal contacts → Family contacts → Email suggestion
- [ ] Tommy Brown (family_user) first
- [ ] Tom Wilson (contact/personal) second
- [ ] Tommy Hilfiger (contact/family) third

---

## Test Suite 4: SmartContactSearch Component (Browser)

### Test 4.1: Component Renders Correctly

**Steps:**
1. Log in as **James**
2. Navigate to Create Event page (or wherever SmartContactSearch is used)
3. Locate the invitee search field

**Expected Results:**
- [ ] Search input is visible with placeholder "Search by name or email..."
- [ ] Search icon is displayed
- [ ] No dropdown visible initially

---

### Test 4.2: Typing Triggers Search

**Steps:**
1. Click in the search field
2. Type "Nic"
3. Wait 300ms (debounce delay)

**Expected Results:**
- [ ] Loading spinner appears briefly
- [ ] Dropdown opens with results
- [ ] Results are grouped by type (Family Members, My Contacts, etc.)
- [ ] Nicola appears under "Family Members"

---

### Test 4.3: Keyboard Navigation

**Steps:**
1. Type a search that returns multiple results
2. Press Down Arrow key
3. Press Down Arrow again
4. Press Up Arrow
5. Press Enter

**Expected Results:**
- [ ] First result highlights on first Down
- [ ] Second result highlights on second Down
- [ ] First result re-highlights on Up
- [ ] Highlighted item is selected on Enter
- [ ] Selection clears search input

---

### Test 4.4: Mouse Selection

**Steps:**
1. Type a search query
2. Hover over different results
3. Click on a result

**Expected Results:**
- [ ] Hover highlights the result
- [ ] Click selects the result
- [ ] Dropdown closes after selection
- [ ] onSelect callback fires with correct data

---

### Test 4.5: Already Selected Prevention

**Steps:**
1. Select a family member (e.g., Nicola)
2. Search for "Nicola" again

**Expected Results:**
- [ ] Nicola appears in results but is dimmed/disabled
- [ ] "Already added" tag is shown
- [ ] Clicking does nothing
- [ ] Keyboard Enter skips this result

---

### Test 4.6: Email Direct Entry

**Steps:**
1. Type "unknown@test.com" (valid email format)
2. Ensure no results match
3. Press Enter

**Expected Results:**
- [ ] Empty state shows "Press Enter to invite as guest"
- [ ] Pressing Enter creates email invitee
- [ ] Selected invitee has type: "email"
- [ ] display_name equals the email address

---

### Test 4.7: Clear Input

**Steps:**
1. Type a search query
2. Click the X clear button

**Expected Results:**
- [ ] Input is cleared
- [ ] Dropdown closes
- [ ] Results are reset

---

### Test 4.8: Click Outside Closes Dropdown

**Steps:**
1. Type a search to open dropdown
2. Click somewhere outside the component

**Expected Results:**
- [ ] Dropdown closes
- [ ] Search text remains (not cleared)
- [ ] Clicking back in input reopens dropdown if text exists

---

## Test Suite 5: Mobile-Specific Tests

### Test 5.1: Responsive Contact List (Mobile)

**Device:** iPhone/Android (or Chrome DevTools mobile emulation)

**Steps:**
1. Open app on mobile device
2. Log in as **James**
3. Navigate to Contacts

**Expected Results:**
- [ ] Contact list is single-column layout
- [ ] Contact cards are full-width
- [ ] Tab selector (My/Family/All) is easily tappable
- [ ] No horizontal scrolling required

---

### Test 5.2: Contact Detail View (Mobile)

**Steps:**
1. On Contacts list, tap a contact
2. View contact details

**Expected Results:**
- [ ] Full-screen detail view opens
- [ ] All fields are readable
- [ ] Edit button is accessible
- [ ] Back navigation is clear

---

### Test 5.3: Create Contact Form (Mobile)

**Steps:**
1. Tap "Add Contact"
2. Fill in contact details
3. Scroll through form
4. Save

**Expected Results:**
- [ ] Form fields are full-width
- [ ] Keyboard doesn't obscure active field
- [ ] Form is scrollable
- [ ] Save button is visible after keyboard close
- [ ] Success feedback is clear

---

### Test 5.4: SmartContactSearch Touch (Mobile)

**Steps:**
1. Navigate to event creation
2. Tap invitee search field
3. Type a search
4. Tap a result

**Expected Results:**
- [ ] Keyboard appears
- [ ] Dropdown appears below input (not obscured by keyboard)
- [ ] Results are large enough to tap accurately
- [ ] Tags in result names may be hidden (responsive CSS)
- [ ] Selection works on tap

---

### Test 5.5: SmartContactSearch Scroll (Mobile)

**Steps:**
1. Search for something with many results
2. Scroll the dropdown

**Expected Results:**
- [ ] Dropdown is scrollable
- [ ] Max height is reduced for mobile (300px vs 400px)
- [ ] Scrolling is smooth
- [ ] Touching results doesn't accidentally scroll

---

### Test 5.6: Publish Toggle Touch (Mobile)

**Steps:**
1. Open a contact you own
2. Tap "Publish to Family" toggle

**Expected Results:**
- [ ] Toggle is easily tappable (adequate size)
- [ ] Visual feedback on tap
- [ ] Confirmation appears
- [ ] State changes correctly

---

## Test Suite 6: Cross-User Scenarios

### Test 6.1: Family Data Isolation

**Steps:**
1. Log in as **James**, create contact "James Private"
2. Do NOT publish to family
3. Log out
4. Log in as **Nicola**
5. Search all contacts for "James Private"

**Expected Results:**
- [ ] Contact does NOT appear in Nicola's contacts
- [ ] Contact does NOT appear in Smart Lookup
- [ ] Only published contacts are visible to family

---

### Test 6.2: Real-Time Update (Publish)

**Steps:**
1. Open two browser windows
2. Window 1: Log in as James
3. Window 2: Log in as Nicola, view Family Contacts
4. In Window 1: Create and publish a new contact
5. In Window 2: Refresh page

**Expected Results:**
- [ ] Nicola sees the newly published contact after refresh
- [ ] Contact shows "Shared by James"

---

### Test 6.3: Delete Published Contact

**Steps:**
1. Log in as **James**
2. Create and publish contact "To Delete"
3. Verify Nicola can see it in Family Contacts
4. As James, delete the contact
5. As Nicola, refresh Family Contacts

**Expected Results:**
- [ ] Contact disappears from Nicola's Family Contacts
- [ ] No orphan references remain
- [ ] Nicola doesn't get error messages

---

## Test Suite 7: Error Handling

### Test 7.1: Network Error on Search

**Steps:**
1. Open SmartContactSearch
2. Disable network in DevTools
3. Type a search query

**Expected Results:**
- [ ] Loading spinner appears
- [ ] Error is handled gracefully (no crash)
- [ ] Console shows error message
- [ ] User sees empty results or error message

---

### Test 7.2: Unauthorized Edit Attempt

**Steps:**
1. Log in as **James**
2. Note the ID of a contact owned by Nicola
3. Attempt PUT `/contacts/{id}` via DevTools/Postman

**Expected Results:**
- [ ] API returns 403 Forbidden
- [ ] Error message: "You don't have permission..."
- [ ] No data is modified

---

### Test 7.3: Invalid Contact ID

**Steps:**
1. Navigate to `/contacts/invalid-uuid`

**Expected Results:**
- [ ] 404 Not Found or graceful error page
- [ ] No application crash
- [ ] Clear error message to user

---

## Completion Checklist

| Suite | Browser | Mobile |
|-------|---------|--------|
| 1. Contacts Ownership | [ ] | [ ] |
| 2. Publish to Family | [ ] | [ ] |
| 3. Smart Lookup API | [ ] | N/A |
| 4. SmartContactSearch | [ ] | [ ] |
| 5. Mobile-Specific | N/A | [ ] |
| 6. Cross-User | [ ] | [ ] |
| 7. Error Handling | [ ] | [ ] |

---

## Notes

- Test on Chrome, Firefox, Safari for browser coverage
- Test on iOS Safari and Android Chrome for mobile
- Use DevTools mobile emulation for initial mobile testing
- Test with real devices for touch accuracy validation

**Tested By:** _________________
**Date:** _________________
**Version:** _________________
