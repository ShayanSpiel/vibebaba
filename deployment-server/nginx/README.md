# Nginx Configuration for Vibebaba

This directory contains the Nginx configuration for handling wildcard subdomains and custom domains for Vibebaba.

## Quick Setup

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Copy Configuration
```bash
sudo cp vibebaba.conf /etc/nginx/sites-available/vibebaba
sudo ln -s /etc/nginx/sites-available/vibebaba /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Optional: remove default site
```

### 3. Setup SSL Certificate

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Get wildcard SSL certificate (requires DNS challenge):
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d vibebaba.com -d *.vibebaba.com
```

**Important:** You will need to add TXT records to your DNS as instructed by certbot:
- Name: `_acme-challenge.vibebaba.com`
- Type: `TXT`
- Value: `[value provided by certbot]`

Wait a few minutes for DNS propagation, then continue with certbot.

### 4. Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup Auto-Renewal
```bash
sudo crontab -e
```

Add this line:
```
0 0 * * * certbot renew --quiet && systemctl reload nginx
```

## DNS Configuration

### For vibebaba.com (Main Domain)
Add these records to your DNS provider:

| Type   | Name | Value              | TTL  |
|--------|------|--------------------|------|
| A      | @    | [YOUR_SERVER_IP]   | 3600 |
| A      | *    | [YOUR_SERVER_IP]   | 3600 |
| CNAME  | www  | vibebaba.com       | 3600 |

### For Custom Domains (User-configured)
Users need to add these records to their DNS:

| Type   | Name | Value              | TTL  |
|--------|------|--------------------|------|
| A      | @    | [YOUR_SERVER_IP]   | 3600 |
| CNAME  | www  | vibebaba.com       | 3600 |

## How It Works

1. **Wildcard Subdomains**: Any subdomain like `my-app.vibebaba.com` is automatically routed to your deployment server
2. **Deployment Server**: The deployment server (port 4000) handles subdomain routing and maps subdomains to project IDs
3. **SSL**: Wildcard SSL certificate covers all subdomains (`*.vibebaba.com`)
4. **Custom Domains**: Users can configure custom domains, which also proxy to the deployment server

## Troubleshooting

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/vibebaba_error.log

# View access logs
sudo tail -f /var/log/nginx/vibebaba_access.log

# Restart Nginx
sudo systemctl restart nginx
```

### DNS Issues
```bash
# Check DNS propagation
dig vibebaba.com
dig my-app.vibebaba.com

# Check TXT records (for SSL)
dig -t TXT _acme-challenge.vibebaba.com
```

## Security Notes

1. **HSTS**: The configuration includes (commented out) HSTS headers for enhanced security
2. **SSL Protocols**: Only TLSv1.2 and TLSv1.3 are enabled
3. **Ciphers**: Strong ciphers are configured
4. **Auto-renewal**: SSL certificates auto-renew to prevent expiration

## File Structure
```
deployment-server/nginx/
├── vibebaba.conf      # Main Nginx configuration
└── README.md          # This file
```
