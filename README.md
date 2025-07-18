

## Admin User Creation & Secure Login

### Creating an Admin User

To securely create an admin user, use the provided script. This ensures the password is hashed and the admin role is set correctly.

1. **Set Environment Variables**
   - In your `.env` file (or your environment), set:
     - `ADMIN_EMAIL` (e.g., `admin@example.com`)
     - `ADMIN_PASSWORD` (choose a strong password)
     - `ADMIN_NAME` (optional, defaults to 'Admin User')

2. **Run the Admin Creation Script**
   ```bash
   node backend/scripts/createAdminUser.js
   ```
   - This will create (or update) the admin user in your database.
   - The password will be securely hashed using the same logic as normal users.

3. **Login as Admin**
   - Go to the login page and enter the admin email and password you set above.
   - Upon successful login, you will be redirected to the admin dashboard if your user has the admin role.

### Security Notes
- The admin creation script is idempotent: if the user exists, it will update their role to admin.
- Never commit your `.env` file or admin credentials to version control.
- Only users with the `admin` role can access admin routes and the admin dashboard.

### Troubleshooting
- If you forget the admin password, update the `ADMIN_PASSWORD` in your `.env` and re-run the script to reset it.
- If you see a password mismatch error, ensure you are using the correct password and that the script was run after the latest code update.
