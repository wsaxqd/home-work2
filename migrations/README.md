# Database Migrations

This directory contains database migration scripts for the AI Universal Education Platform.

## Naming Convention

Migration files follow this naming pattern:
```
V{version}_{timestamp}_{description}.sql
```

Example: `V001_20241206_initial_schema.sql`

## How to Apply Migrations

```bash
# Apply a specific migration
docker exec -i ai_universal_edu psql -U admin -d postgres < migrations/versions/V001_xxx.sql

# Or apply all pending migrations in order
for f in migrations/versions/*.sql; do
  docker exec -i ai_universal_edu psql -U admin -d postgres < "$f"
done
```

## Migration Tracking

Each migration contains:
- `revision`: Current migration ID
- `down_revision`: Previous migration ID (NULL for first migration)
- `upgrade()`: Apply changes
- `downgrade()`: Rollback changes
