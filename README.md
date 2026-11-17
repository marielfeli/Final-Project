
# StayFinder Mobile — Expo SDK 58 + TypeScript

Mobile client built from the supplied StayFinder project. The existing Express + MongoDB backend is retained and shared with the mobile app.

## Requirements
- Node.js 24.x recommended
- npm 11.x
- Expo Go compatible with SDK 58
- MongoDB connection for the backend

## 1. Configure the backend
```bash
cd backend
npm install
```
Create `backend/.env` using `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stayfinder
JWT_SECRET=replace-with-a-long-random-secret
```
Start the backend:
```bash
npm run dev
```
or:
```bash
node server.js
```

## 2. Configure the mobile app
Open another terminal at the project root:
```bash
npm install
```
Copy `.env.example` to `.env` and set the laptop LAN IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
```
Replace `192.168.1.10` with your computer's IPv4 address. Phone and laptop must be on the same Wi-Fi for local testing. Do not use `localhost` on a physical phone because it points to the phone itself.

Start Expo:
```bash
npx expo start -c
```
Scan the QR code using Expo Go. The phone and laptop should be on the same network.

## 3. Event-driven concepts used
- `useState` for form values, selected property, session, favorites, filters, loading and screen state.
- `useEffect` for session restoration and initial data loading.
- Button press handlers for navigation, authentication, favorites, inquiries, booking requests and admin decisions.
- Text input change handlers for forms and search.
- Conditional rendering based on user role and current screen.
- Callback functions for reusable UI controls and API actions.

## Current integration notes
- The supplied backend uses role values `admin`, `owner`, and `tenant`. The mobile UI labels `tenant` as Customer.
- Existing API capabilities retained: authentication, public property browse, favorites, inquiries, owner property creation/listing, and admin dashboard/user/property viewing.
- Booking and the expanded owner verification / listing approval / notifications / reports workflows require the backend routes and schemas to be added and tested before those controls can be considered production-ready. The mobile app includes booking screens and calls the planned `/api/bookings` endpoints; those endpoints are not present in the supplied backend baseline.
- Owner document upload, secure document storage, payment gateway integration, email verification and push notifications are not included in this baseline.

## Important security
The uploaded archive contained a backend `.env` file. Its secrets are intentionally not copied into this package. Create a fresh `.env` from `.env.example`, use a new JWT secret, and rotate any database credentials that may have been exposed or committed.


## Validation performed for this archive
- JSON configuration files parsed successfully.
- Backend JavaScript files passed `node --check`.
- TypeScript/TSX syntax was parsed with the TypeScript compiler; a full typecheck still requires installing the Expo dependencies with `npm install`.
- The app has not been run on a physical Expo Go device in this environment. Verify package alignment with `npx expo install --fix` and `npx expo-doctor` on your Windows machine.
