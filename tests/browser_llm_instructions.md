# SwipeMarket - End-to-End Browser Testing Instructions

These instructions are designed for a browser-capable LLM agent or a human QA tester to verify the core flows of the SwipeMarket application.

## Prerequisites
- The Next.js development server must be running (`http://localhost:3000`).
- Ensure Supabase backend is active and reachable.
- You will need a test phone number capable of receiving SMS (if real Supabase OTP is active) or you must use the standard bypass/test numbers configured in your Supabase Auth settings.

---

## Test Flow 1: Core Navigation and Currency Display
1. Navigate to `http://localhost:3000`.
2. Verify that the homepage loads successfully and the title is "SwipeMarket - Prodaj i kupi brzo".
3. Scroll through the listing cards. Look for the price tags.
4. **Assertion**: Verify that for listings priced in `RSD`, there is a smaller secondary price displayed in `EUR` (or vice versa), which confirms the `/api/exchange-rate` integration is working.

---

## Test Flow 2: Dynamic Category Attributes (Creating a Listing)
1. Navigate to `http://localhost:3000/new` (you may need to log in first. If prompted to log in, complete the login flow and return to `/new`).
2. Locate the "Kategorija" (Category) dropdown.
3. Select the category **"Vozila"** (Vehicles).
4. **Assertion**: Verify that vehicle-specific input fields appear (e.g., Brand, Model, Year, Mileage).
5. Change the category from "Vozila" to **"Nekretnine"** (Real Estate).
6. **Assertion**: Verify that the dynamic fields completely change to real estate variants (e.g., Square footage, Room count).
7. Attempt to click "Objavi oglas" (Publish listing) without uploading any images.
8. **Assertion**: Verify that an error message appears stating "Morate dodati barem jednu sliku" (You must add at least one image).

---

## Test Flow 3: Report System & Slugs
1. From the homepage, click on any active listing to view its details.
2. Note the URL. **Assertion**: The URL should look like `/listing/some-item-name-123456` (confirming stable slugs are used instead of raw UUIDs).
3. On the listing details page, locate and click the "Prijavi oglas" (Report Listing) button.
4. A modal should appear. Select "Spam" or "Prevara" from the dropdown. Optionally type "Test report details" in the text area.
5. Click "Pošalji prijavu" (Submit report).
6. **Assertion**: Look for a success message indicating the report was sent. 

---

## Test Flow 4: Admin Dashboard Guard
1. Navigate directly to `http://localhost:3000/admin`.
2. If you are logged in as a normal user (not an admin), **Assertion**: Verify that you see a screen saying "Nemate pristup" (No access) or are redirected away.
3. If you have credentials for an Admin account, log out, log in as the Admin, and navigate back to `/admin`.
4. **Assertion**: Verify the Admin Dashboard renders, showing queues for "Oglasi na čekanju" (Pending Listings) and "Prijave" (Reports).

---

## Test Flow 5: Search Profiles (Alerts)
1. Navigate to `http://localhost:3000/search-profiles`.
2. Find the form to create a new search profile.
3. Enter a name (e.g., "Jeftini telefoni"), set a max price, and select a category if applicable.
4. Click to save/create the profile.
5. **Assertion**: Verify that the new search profile appears in the list on the same page. Refresh the page and ensure it is still there.

---

**End of Tests.** If all assertions pass, the Phase 5 core feature set is verified as fully functional.
