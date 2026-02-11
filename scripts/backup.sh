#!/bin/bash

# Backup script for TrelloAssist database
# Usage: ./scripts/backup.sh or npm run backup

set -e  # Exit on error

# Configuration
DB_FILE="projects.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/projects_${TIMESTAMP}.db"
KEEP_BACKUPS=10  # Number of backups to keep

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=== TrelloAssist Database Backup ==="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if database exists
if [ ! -f "${DB_FILE}" ]; then
    echo -e "${RED}Error: Database file ${DB_FILE} not found${NC}"
    exit 1
fi

# Create backup
echo "Creating backup..."
cp "${DB_FILE}" "${BACKUP_FILE}"

# Copy WAL file if exists (for consistency)
if [ -f "${DB_FILE}-wal" ]; then
    cp "${DB_FILE}-wal" "${BACKUP_FILE}-wal"
fi

# Copy SHM file if exists
if [ -f "${DB_FILE}-shm" ]; then
    cp "${DB_FILE}-shm" "${BACKUP_FILE}-shm"
fi

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}OK Backup created successfully${NC}"
    echo "  File: ${BACKUP_FILE}"
    echo "  Size: ${BACKUP_SIZE}"
else
    echo -e "${RED}Backup failed${NC}"
    exit 1
fi

# Clean up old backups (keep last 10)
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/projects_*.db 2>/dev/null | wc -l)
if [ "${BACKUP_COUNT}" -gt "${KEEP_BACKUPS}" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up old backups (keeping last ${KEEP_BACKUPS})...${NC}"
    KEEP_PLUS_ONE=$((KEEP_BACKUPS + 1))
    ls -1t "${BACKUP_DIR}"/projects_*.db | tail -n +${KEEP_PLUS_ONE} | while read -r file; do
        rm -f "$file"
        rm -f "$file-wal" 2>/dev/null
        rm -f "$file-shm" 2>/dev/null
        echo "  Deleted: $(basename "$file")"
    done
    echo -e "${GREEN}Old backups cleaned${NC}"
fi

echo ""
echo -e "${GREEN}Backup complete${NC}"
echo ""