# Logo and Favicon Generation Instructions

To generate the proper favicon and logo images for the EdgeTech Employee Portal:

1. Use the SVG logo from `src/assets/edgetech-logo.svg`

2. For favicon.ico:
   - Extract the circle with 'e' logo portion (first group in the SVG)
   - Generate a multi-size favicon.ico with 16x16, 32x32, 48x48, and 64x64 versions
   - Use the purple (#5E2E8E) and green (#A4FF00) colors from the logo

3. For logo192.png and logo512.png:
   - Use the full logo with EdgeTech text
   - Scale it proportionally to fit in 192x192 and 512x512 squares respectively
   - Use a transparent background

4. You can use tools like:
   - Online SVG converter: https://www.pngtosvg.com/
   - Favicon generator: https://realfavicongenerator.net/
   - Or graphics software like Inkscape, Adobe Illustrator, or Photoshop

5. Place the generated files in the public directory:
   - favicon.ico
   - logo192.png
   - logo512.png

This will ensure that the app uses the EdgeTech branding consistently across all platforms and devices. 