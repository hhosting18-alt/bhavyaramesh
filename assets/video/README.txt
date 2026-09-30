hero.mp4 is the homepage background film (STARE, Bhavya Ramesh x NorBlack NorWhite).
Encoded for web: H.264, no audio, fast-start. It fills the hero edge to edge (object-fit: cover).
To swap it, replace hero.mp4 keeping the name, and regenerate the poster:
  ffmpeg -ss 1 -i hero.mp4 -frames:v 1 -q:v 3 ../img/home/hero-stare.jpg
