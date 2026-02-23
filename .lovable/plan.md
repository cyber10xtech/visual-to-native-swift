

# Safesight Customer App - Comprehensive Fix & Polish Plan

## Overview
This plan addresses branding, categories, profile editing, live chat, bookings, notifications, password requirements, database cleanup, icon improvements, and Android readiness.

---

## 1. Logo & Branding Update

**What**: Replace the current logo with the uploaded "S" logo (blue rounded square) across the app.

**Technical details**:
- Copy `user-uploads://Customer_Logo.jpeg` to `src/assets/logo.png` and `public/logo.png` (for favicon/PWA)
- Copy to `public/pwa-192x192.png` and `public/pwa-512x512.png`
- All existing logo references already point to these files, so no code changes needed beyond the file copies

---

## 2. Category Updates & Sleek Icons

**What**: Ensure the 8 professional and 14 handyman categories display with intuitive, sleek icons.

**Technical details** (files: `CategoryCard.tsx`, `CustomerHome.tsx`):
- Categories already match the requested list -- no changes needed to `CustomerHome.tsx`
- Update `CategoryCard.tsx` icon map to use more intuitive icons:
  - Architect: `Compass`
  - Project Manager: `ClipboardList`
  - Builder: `HardHat`
  - Interior Designer: `Palette`
  - Electrical Engineer: `Cable`
  - Structural Engineer: `Building2`
  - Mechanical Engineer: `Cog`
  - Quantity Surveyor: `Calculator`
  - Wall Painter: `Paintbrush`
  - Plumber: `Droplets`
  - Carpenter: `Hammer`
  - Electrician: `Zap`
  - AC Installer: `Wind`
  - Tiler: `Grid3X3`
  - Welder: `Flame`
  - Bricklayer: `Box` (replace with `Layers` for a more intuitive brick-stacking look)
  - Roof Installer: `Home`
  - Furniture Repairs: `Sofa`
  - Industrial Cleaner: `Sparkles`
  - Landscape Expert: `TreePine`
  - Fumigator: `Bug`
  - General Labourer: `Wrench` (more intuitive than `MoreHorizontal`)
- Make category cards slightly more polished with subtle shadow and refined spacing

---

## 3. Fix useProfessionals to Only Show Professionals/Handymen

**What**: The home page currently shows ALL profiles (including customers). Fix the query to exclude customer accounts.

**Technical details** (file: `useProfessionals.tsx`):
- Add `.in("account_type", ["professional", "handyman"])` to the default query
- This ensures only professionals from the ProConnect business app appear in the directory

---

## 4. Fix Profile Edit (Not Saving)

**What**: Profile updates don't persist after editing.

**Technical details** (file: `useCustomerProfile.tsx`):
- The `updateProfile` function currently updates but the re-fetch may not work reliably
- Ensure the `fetchProfile` call after update uses fresh data by adding a small delay or forcing cache bypass
- Verify the `avatar_url` field is included in the update payload in `EditProfile.tsx`

---

## 5. Fix Live Chat with Professionals

**What**: The chat queries reference correct FK names but the conversation creation flow and message sending need to work properly with the shared database.

**Technical details**:
- `CustomerChat.tsx` line 64: Uses `profiles!conversations_professional_id_fkey` -- this matches the actual DB FK name, so the join is correct
- `CustomerMessages.tsx` line 56: Same FK reference -- correct
- Add a "Message" button on `ProfessionalProfile.tsx` that creates a conversation (upsert) and navigates to the chat
- Ensure conversation creation inserts with `customer_id` and `pro_id`

---

## 6. Fix Bookings

**What**: Verify bookings work end-to-end with the shared schema.

**Technical details** (files: `useBookings.tsx`, `BookingRequest.tsx`):
- `useBookings.tsx` line 41: References `profiles!bookings_pro_id_fkey` but the actual FK is `bookings_professional_id_fkey` -- **fix this** to `profiles!bookings_professional_id_fkey`
- `BookingRequest.tsx`: The booking creation looks correct, but verify that `amount` defaults to 0 properly since the DB column is NOT NULL

---

## 7. Fix Notifications

**What**: Verify notifications work with the shared schema.

**Technical details**:
- The `notifications` table uses `user_id` referencing `profiles(id)` per the schema, but the `useNotifications` hook uses `user_id = user.id` (auth user ID)
- Need to check if `notifications.user_id` references `auth.users(id)` or `profiles(id)` -- based on the RLS policies using `auth.uid() = user_id`, it references auth user IDs, so the hook is correct
- The `createNotification` function in `BookingRequest.tsx` passes `professional.user_id` (auth user ID) which is correct

---

## 8. Password Requirements on Sign-Up

**What**: Show password requirements below the password field during registration.

**Technical details** (file: `CustomerRegister.tsx`):
- Add a small helper text below the password input: "Password must be at least 6 characters with a mix of letters and numbers"
- Add real-time validation indicators (checkmarks) for:
  - Minimum 6 characters
  - Contains a letter
  - Contains a number

---

## 9. Flush Database (Remove Test Data)

**What**: Clean up all test/demo data from the database.

**Technical details**:
- Delete all rows from: `messages`, `conversations`, `bookings`, `notifications`, `favorites`, `reviews`, `pro_stats`, `profiles_private`
- Then delete from `profiles` (after dependent data is cleared)
- This leaves the schema intact but removes all test records
- Note: Currently only 5 customer profiles exist; no professional data

---

## 10. Remove Preview Links & Android Prep

**What**: Remove any remaining preview/sandbox URLs and ensure Capacitor config is production-ready.

**Technical details**:
- `capacitor.config.ts` and `capacitor.config.customer.ts`: Already cleaned (no `server.url`)
- `vite.config.ts`: Add `navigateFallbackDenylist: [/^\/~oauth/]` to PWA workbox config
- Verify no hardcoded preview URLs exist anywhere in the codebase
- `CustomerInstall.tsx`: Already clean

---

## 11. Add "Message Professional" Button

**What**: Allow customers to start a chat directly from a professional's profile page.

**Technical details** (file: `ProfessionalProfile.tsx`):
- Add a "Message" button next to "Book Now"
- On click: upsert a conversation with `customer_id` (from profile) and `pro_id` (professional's profile ID), then navigate to `/chat/{conversation_id}`

---

## Summary of Files to Change

| File | Changes |
|------|---------|
| `public/logo.png`, `src/assets/logo.png`, `public/pwa-*.png` | Replace with new logo |
| `src/components/customer/CategoryCard.tsx` | Update icons (Layers, Wrench) |
| `src/hooks/useProfessionals.tsx` | Filter out customer accounts |
| `src/hooks/useBookings.tsx` | Fix FK reference name |
| `src/hooks/useCustomerProfile.tsx` | Fix profile update refetch |
| `src/pages/customer/CustomerRegister.tsx` | Add password requirements UI |
| `src/pages/customer/ProfessionalProfile.tsx` | Add Message button with conversation creation |
| `src/pages/customer/CustomerChat.tsx` | Minor cleanup |
| `vite.config.ts` | Add OAuth denylist to PWA |
| Database | Flush all test data via migration/query |
