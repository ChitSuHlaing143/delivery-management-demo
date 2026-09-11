# Delivery Management System Demo

A front-end demo for the delivery-company requirements gathered in the stakeholder discussion.

## Included requirements

- Roles: **Admin, Staff, Delivery Staff**
- Online Shop / Sender management
- Parcel registration with receiver info, COD, delivery fee, one parcel image, unique tracking number and created date/time
- Manual parcel assignment and reassignment to one Delivery Staff
- Assignment history
- Delivery Staff status flow: **New → Assigned → Pickup → On Way → Complete / Fail**
- Fail reason and re-delivery by reassignment
- Status date/time history
- Fuzzy/partial search and filters
- Dashboard and reports
- PDF, Excel `.xlsx`, and Word `.doc` export
- No hard delete: parcel Cancel/Inactive
- User action/audit logs
- English / Myanmar UI toggle (demo-level translation)
- Responsive Bootstrap layout
- **No public customer tracking page**
- Merchant settlement is out of scope for Version 1

## 1. Run immediately without Google Sheets

Just open `index.html`, or publish the repository with GitHub Pages. The demo uses browser `localStorage` and comes with sample data.

Demo accounts:

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`
- Delivery Staff: `delivery` / `delivery123`

> This authentication is for a UI demo only. Do not use these credentials or client-side authentication in production.

## 2. Publish on GitHub Pages

1. Create a new GitHub repository, e.g. `delivery-management-demo`.
2. Upload all files/folders from this package to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. GitHub will provide a Pages URL such as `https://YOUR-USERNAME.github.io/delivery-management-demo/`.
7. Share that URL with the client.

## 3. Optional Google Sheet backend

The project can use Google Sheets + Apps Script as a demo backend.

### Create the Sheet

1. Create a blank Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Delete the default code and paste `google-apps-script/Code.gs`.
4. Save the project.
5. Run the `setupDemo()` function once from the Apps Script editor.
6. Approve the requested permissions. The script creates these sheets:
   - Users
   - DeliveryStaff
   - OnlineShops
   - Parcels
   - Assignments
   - StatusHistory
   - FailReasons
   - ActionLogs

### Deploy Apps Script

1. In Apps Script choose **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone** (for this client demo only).
5. Deploy and copy the `/exec` Web App URL.

### Configure the web demo

Edit `assets/js/config.js`:

```js
window.DELIVERY_DEMO_CONFIG = {
  COMPANY_NAME: 'SwiftDrop Delivery Demo',
  GOOGLE_APPS_SCRIPT_URL: 'PASTE_YOUR_WEB_APP_EXEC_URL_HERE',
  USE_GOOGLE_SHEETS: true
};
```

Commit/push the change. GitHub Pages will then use Google Sheets when the endpoint is reachable; otherwise the interface falls back to local demo data.

## Main pages

- Dashboard
- Online Shops
- Parcels
- Assign Delivery
- Delivery Staff
- Delivery Records
- Reports
- Users
- Action Logs
- Delivery Staff login: Dashboard / My Deliveries / Delivery Records

## Important demo limitations

This is intentionally a **prototype**, not a production delivery platform. Google Sheets + public Apps Script is convenient for demonstrations but should not be treated as a secure production database/API. A production version should add secure server-side authentication, password hashing, authorization checks on every API call, database transactions, image storage permissions, backups, input validation, rate limiting, and a proper relational database/backend.

## Suggested production ER relationships

- OnlineShop **1 : N** Parcel
- User **1 : 0..1** DeliveryStaff
- Parcel **1 : N** DeliveryAssignment
- DeliveryStaff **1 : N** DeliveryAssignment
- Parcel **1 : N** ParcelStatusHistory
- DeliveryAssignment **1 : N** ParcelStatusHistory
- User **1 : N** ActionLog

The demo keeps the parcel's `current_status` for fast display while storing status changes separately as history. Reassignment never deletes the old assignment; it marks it non-current and creates a new assignment.
