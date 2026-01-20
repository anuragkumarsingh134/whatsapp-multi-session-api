# Uploads Directory

This directory stores all files uploaded through the WhatsApp API file upload feature.

## Important Notes

### Backup
- **Production**: Ensure this directory is included in your backup strategy
- Files in this directory are critical user data and should be backed up regularly
- For Render.com: Files are stored on the persistent disk volume
- For VPS/Proxmox: Include this directory in your backup scripts

### Storage Management
- Default max file size: 50MB per file
- Allowed file types: Images, documents, videos, audio, and archives
- Files are named with timestamp-randomId-originalname format to prevent conflicts

### Security
- Files are served publicly via `/files/:filename` URL
- No authentication required to access files (by design for WhatsApp media sharing)
- Uploaded files require Bearer token authentication

### Maintenance
```bash
# Check disk usage
du -sh uploads/

# Clean old files (example: files older than 30 days)
find uploads/ -type f -mtime +30 -delete
```

## Directory Structure
```
uploads/
├── README.md (this file)
└── [uploaded files with format: timestamp-randomId-filename.ext]
```
