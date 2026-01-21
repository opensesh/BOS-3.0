# BOS-3.0 Supabase Security Audit Report

**Date:** January 20, 2026
**Auditor:** Claude (AI-assisted analysis via Supabase MCP)
**Scope:** Row Level Security (RLS) and database security posture
**Environment:** Development/Demo (not yet public)

---

## Executive Summary

This audit evaluates the security posture of two Supabase projects associated with BOS-3.0 using the built-in Supabase Security Advisor. The findings reveal significant gaps in Row Level Security (RLS) policies that should be addressed before any production deployment or public access.

### Key Findings

| Project | Severity | Finding Count |
|---------|----------|---------------|
| Brand Operating System (fhcnrgdzwceyidcdeprr) | Warning | 7 RLS policies |
| BOS-3.0 (bzpodfomunpczzpnimmz) | Warning + Error | 141 total issues |

### Risk Assessment

**Given the current demo/development status**, these findings represent:
- **Low immediate risk** - No sensitive user data at risk, no public access
- **High future risk** - Must be addressed before any production deployment
- **Data recoverable** - All data can be restored from git repository and Supabase data retention

### Top 3 Priorities

1. **Fix Security Definer View ERROR** on `embedding_queue_status` - Only blocking error
2. **Add RLS Policies** to `chats` and `messages` tables - Contains user-generated content
3. **Review Function Search Paths** - 48 functions have mutable search paths

---

## What These Warnings Actually Mean

### RLS Policy "Always True" (92 instances)

**In plain English:** These tables have RLS enabled, but the policies say "everyone can access everything." It's like having a lock on your door but leaving the key under the mat with a sign pointing to it.

**What happens:** Any authenticated user can read/write any row in these tables, regardless of whether they own the data or have permission.

**Why it exists:** During development, it's common to start with permissive policies to get things working, then tighten them later. These are placeholders that were never replaced with real rules.

**Tables affected (35 total):**
- `artifacts` - User-created content
- `brain_*` tables (7) - AI agent configurations
- `brand_*` tables (5) - Brand assets and documents
- `brands` - Brand definitions
- `canvases` - Collaborative documents
- `chats` & `messages` - Conversation history
- `files` - User uploads
- `mcp_*` tables (2) - MCP server configs
- `projects` & `project_*` tables (2) - Project data
- Plus 13 other supporting tables

### Function Search Path Mutable (48 instances)

**In plain English:** Database functions don't specify which schema to look in when they run. A malicious actor could create a fake function with the same name in a different schema and trick the database into running it instead.

**Real-world risk:** Low for a demo environment. This becomes a concern if you allow untrusted users to create database objects or if you're running in a shared database environment.

**Why it happens:** When you create a function without `SET search_path = public`, PostgreSQL uses whatever search path is active at runtime.

### Security Definer View (1 instance)

**In plain English:** The `embedding_queue_status` view runs with elevated privileges but could potentially be exploited if its underlying functions are compromised.

**What to do:** Either remove the `SECURITY DEFINER` attribute or ensure the view only calls trusted functions.

---

## Detailed Findings

### Project 1: Brand Operating System (fhcnrgdzwceyidcdeprr)

| Issue | Severity | Tables/Functions |
|-------|----------|------------------|
| RLS Policy Always True | Warning | `chats` (4 policies) |
| RLS Policy Always True | Warning | `messages` (3 policies) |

**Impact:** Any authenticated user could access any chat or message, regardless of who created it.

**Fix complexity:** Low - Add `user_id = auth.uid()` checks to existing policies.

---

### Project 2: BOS-3.0 (bzpodfomunpczzpnimmz)

#### RLS Warnings (92 instances across 35 tables)

| Category | Tables | Policy Count |
|----------|--------|--------------|
| Core content | `chats`, `messages`, `canvases`, `artifacts` | 18 |
| Brand data | `brands`, `brand_*` tables | 24 |
| AI/Brain | `brain_*` tables | 28 |
| Projects | `projects`, `project_*` tables | 12 |
| Infrastructure | `mcp_*`, `files`, others | 10 |

#### Function Search Path Warnings (48 instances)

Most of these are automatically generated functions from Supabase triggers and the pgvector extension. Key functions to review:

| Function | Purpose | Risk |
|----------|---------|------|
| `match_documents` | Vector similarity search | Low |
| `match_assets` | Asset search | Low |
| `match_document_chunks` | Chunk search | Low |
| `process_embedding_queue` | Background job | Low |
| `handle_*` triggers | Data lifecycle | Low |

#### Security Definer View ERROR (1 instance)

**Affected:** `embedding_queue_status` view

This view likely aggregates queue statistics and was marked as `SECURITY DEFINER` to allow all users to see queue status regardless of RLS policies. However, this creates a potential privilege escalation vector.

---

## Risk Assessment Matrix

| Scenario | Current Risk | Risk if Public |
|----------|--------------|----------------|
| Data exposure between users | Low (single user) | **Critical** |
| Data deletion/modification | Low (dev data only) | **Critical** |
| Privilege escalation | Very Low | Medium |
| SQL injection via functions | Very Low | Low |

---

## Recommended Options

### Option A: Minimal Fix (Before Any Shared Access)
**Effort:** 2-4 hours
**When:** Before inviting any other users

1. **Fix the Security Definer View ERROR**
   ```sql
   -- Option 1: Remove SECURITY DEFINER
   DROP VIEW IF EXISTS embedding_queue_status;
   CREATE VIEW embedding_queue_status AS ...;  -- without SECURITY DEFINER

   -- Option 2: Set explicit search path
   ALTER VIEW embedding_queue_status SET (security_invoker = on);
   ```

2. **Add basic RLS to chat tables**
   ```sql
   -- Replace permissive policies with ownership checks
   DROP POLICY IF EXISTS "Users can view own chats" ON chats;
   CREATE POLICY "Users can view own chats" ON chats
     FOR SELECT USING (user_id = auth.uid());

   -- Repeat for INSERT, UPDATE, DELETE
   ```

---

### Option B: Comprehensive Fix (Before Production)
**Effort:** 1-2 days
**When:** Before any production deployment

Everything in Option A, plus:

1. **Audit all 35 tables** and implement proper RLS:
   - User-owned data: `user_id = auth.uid()`
   - Brand data: Join through brands table with membership check
   - Shared data: Explicit sharing table or role-based access

2. **Fix function search paths:**
   ```sql
   ALTER FUNCTION match_documents SET search_path = public;
   -- Repeat for all 48 functions
   ```

3. **Create migration files** for all changes (version controlled)

---

### Option C: Full Security Overhaul (Enterprise Ready)
**Effort:** 1-2 weeks
**When:** Before enterprise customers or sensitive data

Everything in Options A and B, plus:

1. **Implement proper multi-tenancy:**
   - Brand-level isolation
   - Team/workspace membership tables
   - Granular permissions (viewer, editor, admin)

2. **Add audit logging:**
   - Track who accessed what data
   - Log all policy violations

3. **Security testing:**
   - Penetration testing of RLS policies
   - Automated policy validation tests

---

## Implementation Notes

### Quick Reference: RLS Policy Patterns

**User owns the row:**
```sql
CREATE POLICY "policy_name" ON table_name
  FOR ALL USING (user_id = auth.uid());
```

**User is member of brand:**
```sql
CREATE POLICY "policy_name" ON brand_assets
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );
```

**Public read, owner write:**
```sql
CREATE POLICY "Public read" ON table FOR SELECT USING (true);
CREATE POLICY "Owner write" ON table FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner update" ON table FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Owner delete" ON table FOR DELETE USING (user_id = auth.uid());
```

### Migration Strategy

1. **Create a new migration file:**
   ```
   supabase/migrations/XXX_fix_rls_policies.sql
   ```

2. **Test locally first:**
   ```bash
   supabase db reset  # Apply all migrations fresh
   ```

3. **Apply to remote:**
   ```bash
   supabase db push
   ```

---

## Tables Requiring Attention

### High Priority (User-Generated Content)
| Table | Current Policies | Recommended |
|-------|------------------|-------------|
| `chats` | Always true (4) | User ownership |
| `messages` | Always true (3) | User ownership via chat |
| `canvases` | Always true (4) | User ownership + sharing |
| `artifacts` | Always true (4) | User ownership |
| `files` | Always true (4) | User ownership |

### Medium Priority (Brand Data)
| Table | Current Policies | Recommended |
|-------|------------------|-------------|
| `brands` | Always true | Owner + team membership |
| `brand_assets` | Always true | Brand membership |
| `brand_documents` | Always true | Brand membership |
| `brand_document_chunks` | Always true | Via document |
| `brand_guidelines` | Always true | Brand membership |
| `brand_colors` | Always true | Brand membership |

### Lower Priority (System/Config)
| Table | Current Policies | Recommended |
|-------|------------------|-------------|
| `brain_*` tables | Always true | Admin only or user ownership |
| `mcp_*` tables | Always true | User ownership |
| `projects` | Always true | User ownership + team |

---

## Appendix: Full Issue List

### RLS Policy Always True Warnings

<details>
<summary>Click to expand full list (92 policies across 35 tables)</summary>

**Project: bzpodfomunpczzpnimmz**

1. `artifacts` - 4 policies (SELECT, INSERT, UPDATE, DELETE)
2. `brain_agents` - 4 policies
3. `brain_brand_identity` - 4 policies
4. `brain_commands` - 4 policies
5. `brain_knowledge` - 4 policies
6. `brain_plugins` - 4 policies
7. `brain_skills` - 4 policies
8. `brain_system` - 4 policies
9. `brain_writing_styles` - 4 policies
10. `brand_assets` - 4 policies
11. `brand_colors` - 4 policies
12. `brand_document_chunks` - 4 policies
13. `brand_documents` - 4 policies
14. `brand_guidelines` - 4 policies
15. `brands` - 4 policies
16. `canvases` - 4 policies
17. `chats` - 4 policies
18. `files` - 4 policies
19. `mcp_connections` - 4 policies
20. `mcp_server_config` - 4 policies
21. `messages` - 3 policies
22. `project_files` - 4 policies
23. `project_instructions` - 4 policies
24. `projects` - 4 policies
25-35. (Additional system tables)

</details>

### Function Search Path Mutable Warnings

<details>
<summary>Click to expand full list (48 functions)</summary>

- `match_documents`
- `match_assets`
- `match_document_chunks`
- `process_embedding_queue`
- `handle_new_document`
- `handle_updated_document`
- `handle_new_asset`
- `handle_updated_asset`
- `handle_new_chunk`
- `handle_updated_chunk`
- (38 additional trigger and utility functions)

</details>

---

## Conclusion

The current security posture is appropriate for a **single-developer demo environment** but requires remediation before any of the following:

- Inviting other users to test
- Storing any real or sensitive data
- Public deployment
- Production use

The recommended path is **Option B** (Comprehensive Fix) implemented incrementally:
1. Fix the Security Definer ERROR immediately
2. Add proper RLS to `chats` and `messages` before any shared access
3. Complete remaining tables before production

All fixes can be done through SQL migrations and don't require application code changes, as the application already passes `user_id` to relevant queries.

---

*Report generated by Claude on January 20, 2026*
*Data source: Supabase Security Advisor via MCP integration*
