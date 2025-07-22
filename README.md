

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

## JWT Authentication Debugging & Best Practices

When using JWT authentication in this project, keep the following checklist in mind to avoid subtle bugs:

### 1. JWT Payload Consistency
- Ensure the property used to store the user ID in the JWT payload (e.g., `userId`) matches what your backend expects in the authentication middleware.
- Example: If you sign tokens with `{ userId: user._id }`, always use `decoded.userId` in your middleware.

### 2. Middleware Extraction
- In your authentication middleware, extract the user ID from the correct property:
  ```js
  // Correct:
  req.user = await User.findById(decoded.userId).select('-password');
  // Incorrect (if your payload uses userId):
  req.user = await User.findById(decoded.id)
  ```

### 3. MongoDB Aggregation Type Matching
- When matching ObjectId fields in aggregations, always ensure both sides are the same type.
- If in doubt, use `$toString` for robust matching:
  ```js
  { $eq: [ { $toString: '$user' }, userId.toString() ] }
  ```

### 4. Debugging Steps
- If user-specific queries always return empty or incorrect results:
  - Log the decoded JWT payload.
  - Log the value and type of `req.user` and `userId`.
  - Check the types of fields in your MongoDB collections.
- Always verify that the frontend is sending the `Authorization` header with the correct token.

### 5. General Advice
- Keep your JWT signing and verification logic in sync.
- Document your JWT payload structure in this README for future reference.
- If you change the payload structure, update both the token creation and all middleware that reads it.

---

**Following this checklist will help you avoid silent authentication bugs and ensure your user-specific features work reliably.**
