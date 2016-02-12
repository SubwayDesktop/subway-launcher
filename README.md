# Subway Launcher

An HTML5-based application launcher for GNU/Linux with MS-modern-like style.

## Installation

There's no installation scripts now. It is required to create directories manually.
If you are just debugging, it is recommended to see the directory structure showed by the code below and test it without installation.
Because we haven't designed the directory structure standard for our WebApps, in order not to break the FHS, it is recommended to install it to `/opt`

### Dependencies

(Cubway)
`qt5` `libqtxdg`

### Install Cubway
```
$ git clone https://github.com/Icenowy/Cubway
$ cd Cubway
$ cmake .
$ make
$ cd Modules/Xdg
$ cmake .
$ make
$ cd ../..
# mkdir -p /opt/Subway/Cubway/Modules/Xdg
# cp cubway /opt/Subway/Cubway/
# cp Modules/Xdg/lib* /opt/Subway/Cubway/Modules/Xdg/
```
### Install Babel
```
# cd /opt/Subway/Cubway/
# wget https://cirno.xyz/~jqk/files/Babel.tar.gz
# tar -vxaf Babel.tar.gz
# rm Babel.tar.gz
```
### Install Simple.js
```
$ git clone https://github.com/SubwayDesktop/simple.js
# mkdir /opt/Subway/simple.js
# cp simple.js/simple.js /opt/Subway/simple.js/
```
### Install Subway Launcher
```
$ git clone https://github.com/SubwayDesktop/subway-launcher
$ cd subway-launcher
# mkdir /opt/Subway/launcher
# cp * /opt/Subway/launcher
```

## Run it

```
$ /opt/Subway/Cubway/cubway /opt/Subway/launcher/main.html
```

## Toggle Visible

```
dbus-send --session --dest=org.subway.launcher --type=method_call /view org.subway.cubway.toggleVisible
```

