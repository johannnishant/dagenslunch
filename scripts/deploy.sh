#!/bin/bash

# Prompt for subfolder name
echo "Enter your subfolder name (default: dagens, or press enter to use default):"
read SUBFOLDER_NAME

if [ -z "$SUBFOLDER_NAME" ]; then
    SUBFOLDER_NAME="dagens"
fi

# Build the application
echo "Building the application..."
npm run build

# Update the base path in vite config temporarily
sed -i.bak "s|base: '/dagens/',|base: '/$SUBFOLDER_NAME/',|g" vite.config.ts

# Update the basename in App.tsx temporarily
sed -i.bak "s|basename=\"/dagens\"|basename=\"/$SUBFOLDER_NAME\"|g" src/App.tsx

# Rebuild with correct base path
echo "Rebuilding with correct base path..."
npm run build

# Restore the original vite config
mv vite.config.ts.bak vite.config.ts

# Restore the original App.tsx
mv src/App.tsx.bak src/App.tsx

# Copy .htaccess file to dist folder with correct subfolder
echo "Adding .htaccess file with subfolder configuration..."
cat > dist/.htaccess << EOF
# Enable mod_rewrite
RewriteEngine On

# Set correct MIME types
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType text/html .html
AddType image/svg+xml .svg
AddType image/x-icon .ico

# Force correct MIME types for JavaScript modules
<FilesMatch "\.(js|mjs)$">
    ForceType application/javascript
    Header set Content-Type "application/javascript"
</FilesMatch>

# Force correct MIME types for CSS files
<FilesMatch "\.css$">
    ForceType text/css
    Header set Content-Type "text/css"
</FilesMatch>

# Force correct MIME types for HTML files
<FilesMatch "\.html$">
    ForceType text/html
    Header set Content-Type "text/html"
</FilesMatch>

# Enable CORS for the CORS proxy requests
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Handle client-side routing for subfolder deployment
RewriteBase /$SUBFOLDER_NAME/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /$SUBFOLDER_NAME/index.html [L]

# Disable caching for development (optional)
<IfModule mod_expires.c>
    ExpiresActive Off
</IfModule>
<IfModule mod_headers.c>
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>
EOF

echo "Build complete! The dist folder is ready for deployment to /$SUBFOLDER_NAME/"
echo "Upload the contents of the dist folder to your web server's /$SUBFOLDER_NAME/ directory" 