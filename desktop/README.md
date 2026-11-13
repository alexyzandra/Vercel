# Hidey Dots for Windows

The same game as the `/hidey-dots` web page, wrapped in a desktop app so it can
read the computer's real screen settings instead of asking the parent.

**Read automatically:** screen brightness (built-in laptop screens only), night
light, Windows colour filters, whether f.lux is running, HDR, and the screen's
name and whether it is built-in or external.

**Still asked by hand:** glare, the grey reference card, an external monitor's
own picture mode, and brightness / night light whenever Windows can't report them.

## Get the app

Every push that touches the game builds `HideyDots.exe` on GitHub: open the
repository's **Actions** tab, pick the latest "Build Hidey Dots for Windows"
run, and download the **HideyDots-Windows** artifact. The exe is unsigned, so
Windows SmartScreen will warn the first time ("More info" › "Run anyway").

## Build it yourself (on Windows, Node 20+)

```
npm install            # in the repository root
cd desktop
npm install
npm start              # run the app
npm run dist           # make dist/HideyDots.exe
```

`win-settings.js` holds everything Windows-specific. The night-light reading
relies on an undocumented registry value; if it doesn't recognise what it
finds, the app falls back to asking the parent.
