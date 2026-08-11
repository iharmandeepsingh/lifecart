# LifeCart Security & Privacy Architecture

## 🔒 Security Principles

1. **Strict Household Data Isolation**:
   - `verifyHouseholdAccess(userId, householdId)` enforces that users can only read or mutate records belonging to their active household.
   - Cross-household IDOR (Insecure Direct Object Reference) access attempts are blocked at the controller level.

2. **Role-Based Authorization (RBAC)**:
   - User Roles: `USER`, `HOUSEHOLD_ADMIN`, `SYSTEM_ADMIN`.
   - Server-side authorization check on sensitive endpoints like `/api/admin/evaluation`.

3. **Input Sanitization & File Upload Protection**:
   - File uploads restricted to `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
   - Maximum upload size restricted to 10MB.
