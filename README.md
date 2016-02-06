# Subway Launcher

## Toggle Visible

```
dbus-send --session --dest=org.subway.launcher --type=method_call /view org.subway.cubway.toggleVisible
```

## Development Plan

We are going to implement an HTML5-based application launcher for GNU/Linux with MS-metro-like style. It will use the [Cubway](https://github.com/EasternHeart/Cubway) instead of NW.js and Electron.

- Create a complete xdg module for Cubway to integrate it with GNU/Linux desktop
- Implement it with plain JavaScript (no huge library such as Angular.js)

