# experimental-fast-timeline
Explorations into a faster explorable timeline

Test here:  http://j.mp/fastgraph

iPhone 6 / Safari
-----------------
    Canvas 1000 segments: 60 FPS
    Canvas 5000 segments: 20 FPS
    WebGL: 10K segments: 60 FPS

iPhone 5s / Safari
------------------
    Canvas 1000 segments: 60 FPS
    Canvas 5000 segments: 20 FPS

iPhone 5s / Chrome
------------------
    Canvas 1000 segments: 60 FPS
    Canvas 5000 segments: 16 FPS

iPhone 5 / Safari
-----------------
    Canvas 1000 segments: 30 FPS
    Canvas 5000 segments: 8 FPS

Nexus 5 / Chrome
----------------
    Canvas 1000 segments: 30 FPS
    Canvas 5000 segments: 7 FPS
    
Nexus 10 / Chrome
-----------------
    Canvas 1000 segments: 30 FPS
    Canvas 5000 segments: 8 FPS

Nexus 7 / Chrome
----------------
    Canvas 1000 segments: 16 FPS
    Canvas 5000 segments: 4 FPS, and touch events seem to break
    WebGL: Runs, but does not display

iPad 1 (2010), iOS 5.1.1 / Safari
---------------------------------
    0 FPS (initial draw, but then hangs)

