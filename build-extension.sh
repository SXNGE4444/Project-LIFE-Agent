#!/bin/bash
echo "╔══════════════════════════════════════════════════════╗"
echo "║   BUILDING LIFE AGENT FOR ALL BROWSERS             ║"
echo "╚══════════════════════════════════════════════════════╝"

# Source files
SRC="browser-extension"
BUILD="build"

# Clean build directory
rm -rf $BUILD
mkdir -p $BUILD/chrome $BUILD/brave $BUILD/edge $BUILD/firefox $BUILD/opera

# Copy common files to all builds
for browser in chrome brave edge opera; do
    echo "Building for $browser..."
    mkdir -p $BUILD/$browser/{config,lib,popup,icons,rules}
    
    # Copy all files
    cp -r $SRC/config/* $BUILD/$browser/config/ 2>/dev/null
    cp -r $SRC/lib/* $BUILD/$browser/lib/ 2>/dev/null
    cp -r $SRC/popup/* $BUILD/$browser/popup/ 2>/dev/null
    cp -r $SRC/icons/* $BUILD/$browser/icons/ 2>/dev/null
    cp -r $SRC/rules/* $BUILD/$browser/rules/ 2>/dev/null
    
    # Use universal files
    cp lib/pattern-detector-universal.js $BUILD/$browser/lib/pattern-detector.js
    cp content-script-cross.js $BUILD/$browser/content-script.js
    
    # Chrome manifest
    cp $SRC/manifest.json $BUILD/$browser/
    
    # Create zip
    cd $BUILD/$browser
    zip -r ../life-agent-$browser.zip . > /dev/null
    cd ../../..
    echo "   ✅ life-agent-$browser.zip created"
done

# Firefox build (special handling)
echo "Building for Firefox..."
mkdir -p $BUILD/firefox/{config,lib,popup,icons,rules}
cp -r $SRC/config/* $BUILD/firefox/config/ 2>/dev/null
cp -r $SRC/lib/* $BUILD/firefox/lib/ 2>/dev/null
cp -r $SRC/popup/* $BUILD/firefox/popup/ 2>/dev/null
cp -r $SRC/icons/* $BUILD/firefox/icons/ 2>/dev/null
cp -r $SRC/rules/* $BUILD/firefox/rules/ 2>/dev/null
cp lib/pattern-detector-universal.js $BUILD/firefox/lib/pattern-detector.js
cp content-script-cross.js $BUILD/firefox/content-script.js

cd $BUILD/firefox
zip -r ../life-agent-firefox.zip . > /dev/null
cd ../../..
echo "   ✅ life-agent-firefox.zip created"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   BUILD COMPLETE!                                   ║"
echo "║                                                      ║"
echo "║   Files in build/ directory:                        ║"
echo "╚══════════════════════════════════════════════════════╝"
ls -la $BUILD/*.zip
echo ""
echo "Ready to install on any browser!"
