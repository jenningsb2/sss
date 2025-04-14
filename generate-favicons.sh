#!/bin/bash

# Create a favicons directory if it doesn't exist
mkdir -p favicons

# Source image
SOURCE="assets/images/profile.jpeg"

# Generate favicon.ico with multiple sizes (16x16, 32x32, 48x48)
convert "$SOURCE" -background white -flatten -resize 16x16 -gravity center -extent 16x16 \
  \( +clone -resize 32x32 -gravity center -extent 32x32 \) \
  \( +clone -resize 48x48 -gravity center -extent 48x48 \) \
  -depth 8 favicons/favicon.ico

# Generate different PNG sizes
convert "$SOURCE" -background white -flatten -resize 16x16 favicons/favicon-16x16.png
convert "$SOURCE" -background white -flatten -resize 32x32 favicons/favicon-32x32.png
convert "$SOURCE" -background white -flatten -resize 48x48 favicons/favicon-48x48.png
convert "$SOURCE" -background white -flatten -resize 192x192 favicons/android-chrome-192x192.png
convert "$SOURCE" -background white -flatten -resize 512x512 favicons/android-chrome-512x512.png

# Apple touch icons
convert "$SOURCE" -background white -flatten -resize 180x180 favicons/apple-touch-icon.png
convert "$SOURCE" -background white -flatten -resize 152x152 favicons/apple-touch-icon-152x152.png
convert "$SOURCE" -background white -flatten -resize 120x120 favicons/apple-touch-icon-120x120.png

# Microsoft tiles
convert "$SOURCE" -background white -flatten -resize 144x144 favicons/mstile-144x144.png
convert "$SOURCE" -background white -flatten -resize 150x150 favicons/mstile-150x150.png
convert "$SOURCE" -background white -flatten -resize 310x310 favicons/mstile-310x310.png

# Generate webmanifest file
cat > favicons/site.webmanifest << EOF
{
  "name": "Nan Yu",
  "short_name": "Nan Yu",
  "icons": [
    {
      "src": "android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
EOF

# Generate browserconfig.xml for Microsoft browsers
cat > favicons/browserconfig.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="mstile-150x150.png"/>
            <square310x310logo src="mstile-310x310.png"/>
            <TileColor>#ffffff</TileColor>
        </tile>
    </msapplication>
</browserconfig>
EOF

echo "Favicons have been generated in the favicons directory!"
