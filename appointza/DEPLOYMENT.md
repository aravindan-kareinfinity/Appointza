# appointza Production Deployment Guide

## Production Build

### Quick Build Commands

From the **repo root** (UI + server, single output folder):

```powershell
.\build-appointza.ps1
```

Output: `D:\aravindan\build\appointza\` (`appointza.exe` + `wwwroot/` + `config.js`)

**Manual server-only publish:**
```bash
dotnet restore appointza/appointza.csproj
dotnet build appointza/appointza.csproj -c Release
dotnet publish appointza/appointza.csproj -c Release -o D:\aravindan\build\appointza --self-contained false
```

## Build Output

The production build is published to: `D:\aravindan\build\appointza\`

## Prerequisites on Target Server

1. **.NET 6.0 Runtime** (or SDK)
   - Download from: https://dotnet.microsoft.com/download/dotnet/6.0
   - Verify installation: `dotnet --version`

2. **PostgreSQL Database**
   - Ensure database is accessible from the server
   - Update connection string in `appsettings.json`

3. **Required Services:**
   - Redis (if using Redis caching)
   - AWS S3 (if using S3 for file storage)

## Deployment Steps

### 1. Copy Files to Server
Copy all files from the `publish` folder to your production server.

### 2. Update Configuration
Edit `appsettings.json` with production settings:
- Database connection string
- AWS credentials (if using S3)
- JWT secret
- Razorpay keys (production keys)
- Firebase configuration
- Redis connection string

### 3. Set Environment Variables (Optional)
You can override settings using environment variables:
```bash
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="your-connection-string"
```

### 4. Run the Application

**Option A: Direct Execution**
```bash
cd /path/to/publish
./appointza
```

**Option B: Using dotnet**
```bash
cd /path/to/publish
dotnet appointza.dll
```

**Option C: As a Service (Linux systemd)**
Create `/etc/systemd/system/appointza.service`:
```ini
[Unit]
Description=appointza Production App
After=network.target

[Service]
Type=notify
WorkingDirectory=/path/to/publish
ExecStart=/usr/bin/dotnet /path/to/publish/appointza.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=appointza
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable appointza
sudo systemctl start appointza
sudo systemctl status appointza
```

**Option D: IIS (Windows)**
1. Install .NET 6.0 Hosting Bundle
2. Create application pool targeting .NET CLR Version "No Managed Code"
3. Point website to publish folder
4. Configure bindings and SSL

### 5. Configure Reverse Proxy (Recommended)

Production is often behind **nginx**. If nginx serves `wwwroot` with a root-level
`try_files ... /index.html`, then `/stay/` and `/webzys/` incorrectly load the
Appointza SPA (and show Appointza’s 404). Local `http://localhost:5000/stay/` works
because it hits Kestrel directly.

**Preferred: proxy everything to the .NET app** (same behavior as local):

```nginx
server {
    listen 80;
    server_name appointza.com www.appointza.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**If nginx must serve static files**, do **not** fall back to root `/index.html` for
product URLs. Use one location per SPA:

```nginx
# Adjust root to your deploy folder's wwwroot
root /var/www/appointza/wwwroot;

location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
}

location /stay/ {
    try_files $uri $uri/ /stay/index.html;
}
location /webzys/ {
    try_files $uri $uri/ /webzys/index.html;
}
location /campusza/ {
    try_files $uri $uri/ /campusza/index.html;
}
location /appointza/ {
    try_files $uri $uri/ /appointza/index.html;
}

# Optional: root → Appointza
location = / {
    return 302 /appointza/;
}

# Do NOT use: try_files $uri /index.html;  for the whole site
```

Then reload nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

Also restart the app after copying a new `appointza.exe`:
```bash
sudo systemctl restart appointza
```

## Important Files to Review

Before deployment, ensure these files are properly configured:

1. **appsettings.json** - Server configuration (only settings file in the build output)
2. **log4net.config** - Logging configuration
3. **appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json** - Firebase credentials

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use production database connection string
- [ ] Use production Razorpay keys (not test keys)
- [ ] Secure Firebase admin SDK JSON file
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set proper file permissions
- [ ] Remove or secure development settings
- [ ] Update package versions with known vulnerabilities:
  - Npgsql (currently 6.0.7 has vulnerabilities)
  - System.Data.SqlClient (has vulnerabilities)
  - System.IdentityModel.Tokens.Jwt (has moderate vulnerability)

## Monitoring

- Check application logs in the configured log directory
- Monitor database connections
- Monitor Redis connections (if used)
- Set up health checks endpoint monitoring

## Troubleshooting

### Connection Issues
- Verify database connection string
- Check firewall rules
- Verify network connectivity

### Performance Issues
- Check connection pooling settings
- Monitor database query performance
- Review Redis cache usage

### Build Warnings
The build shows some package vulnerability warnings. Consider updating:
- `Npgsql` to latest version
- `System.Data.SqlClient` to `Microsoft.Data.SqlClient`
- `System.IdentityModel.Tokens.Jwt` to latest version

## Rollback Procedure

1. Stop the application
2. Restore previous version from backup
3. Restart the application
4. Verify functionality

