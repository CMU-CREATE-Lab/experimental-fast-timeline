# experimental-fast-timeline
Explorations into a faster explorable timeline

Test here:  http://j.mp/fastgraph

(If you're not sure whether your browser should be supporting WebGL, look for a spinning cube here: https://get.webgl.org/)

 Device                                        | Canvas 1K segments | Canvas 5K segments | WebGL 10K segments 
:----------------------------------------------|-------------------:|-------------------:|---------------------:
iPhone 6 / iOS 8 / Safari                      | 60 FPS             | 20 FPS             | 60 FPS
iPhone 5s / Safari                             | 60 FPS             | 20 FPS             |
iPhone 5s / Chrome                             | 60 FPS             | 16 FPS             |
iPhone 5 / Safari                              | 30 FPS             | 8 FPS              |
iPad 3rd gen / iOS 8.1.1 / Safari              | 17 FPS             | 6 FPS              | 50 FPS
iPad 3rd gen / iOS 7.1.2 / Safari              | 28 FPS             | 8 FPS              | Not available (requires iOS 8)
iPad 3rd gen / iOS 7.1.2 / Chrome              | 20 FPS             | 5 FPS              | Not available (requires iOS 8)
Nexus 5 / Chrome                               | 30 FPS             | 7 FPS              |
Nexus 10 / Chrome                              | 30 FPS             | 8 FPS              |
Nexus 7 / Android 4.4.4 / Chrome               | 16 FPS             | 4 FPS and touch events seem to break | Runs but does not display
HTC M8 / Chrome                                | 30 FPS             | 8 FPS              | 60 FPS
Lumia 920 / Windows Phone                      | 26 FPS             | 6 FPS              |
Galaxy S3 / Android 4.4.4 Cyanogen / Chrome    | 12 FPS             | 5 FPS              |
Galaxy S3 / Android 4.4.4 Cyanogen / Firefox   | 9 FPS              | 2 FPS              |
Galaxy S3 / Android 4.4.4 Cyanogen / "Browser" | 6 FPS              | 1 FPS              |
iPad 1 (2010) / iOS 5.1.1 / Safari             | 0 FPS (initial draw, but then hangs) | | |

