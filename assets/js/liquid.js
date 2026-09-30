/* Liquid image effect (WebGL). Usage: <img data-liquid src="..."> — a canvas is layered
   over the image; the texture gently undulates like something seen through water, the
   pointer adds a ripple, and small specks drift upward. Falls back to the plain image
   when WebGL is unavailable or reduced motion is requested. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `
    precision mediump float; varying vec2 v;
    uniform sampler2D tex; uniform float t; uniform vec2 mouse; uniform float mouseStr; uniform vec2 scale; uniform float amp; uniform float seed;
    // hash & value noise
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
    void main(){
      vec2 uv = v;
      // cover-fit
      uv = (uv - .5) * scale + .5;
      // slow liquid undulation: layered sine + noise
      float n1 = noise(uv * 3.0 + vec2(t * .08, t * .05) + seed);
      float n2 = noise(uv * 6.0 - vec2(t * .06, t * .09) + seed * 2.);
      vec2 d = vec2(sin(uv.y * 9. + t * .7 + n1 * 4.), cos(uv.x * 7. - t * .6 + n2 * 4.)) * amp;
      d += (vec2(n1, n2) - .5) * amp * 1.6;
      // pointer ripple
      vec2 m = uv - mouse; float r = length(m);
      float ripple = sin(r * 40. - t * 6.) * exp(-r * 6.) * mouseStr * .012;
      d += normalize(m + 1e-4) * ripple;
      vec2 suv = clamp(uv + d, 0.001, 0.999);
      // subtle chromatic split for a wet-glass feel
      vec3 col;
      col.r = texture2D(tex, suv + d * .08).r;
      col.g = texture2D(tex, suv).g;
      col.b = texture2D(tex, suv - d * .08).b;
      // caustic-like shimmer
      float sh = noise(uv * 14. + vec2(t * .3, -t * .2)) * noise(uv * 9. - vec2(t * .15));
      col += sh * .04;
      // drifting specks
      float sp = 0.;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 g = uv * (26. + fi * 9.) + vec2(fi * 3.1 + seed, t * (.05 + fi * .02));
        vec2 cell = floor(g), f = fract(g) - .5;
        float h = hash(cell + fi);
        vec2 o = (vec2(hash(cell + 7.), hash(cell + 13.)) - .5) * .8;
        float dist = length(f - o);
        float twinkle = .6 + .4 * sin(t * (1. + h * 2.) + h * 20.);
        sp += smoothstep(.06, .0, dist) * step(.93, h) * twinkle;
      }
      col += sp * .55;
      gl_FragColor = vec4(col, 1.);
    }`;

  function create(img) {
    if (img.dataset.liquidReady) return;
    const wrap = document.createElement('div'); wrap.className = 'liquid';
    img.parentNode.insertBefore(wrap, img); wrap.appendChild(img);
    const cv = document.createElement('canvas'); cv.className = 'liquid__canvas'; wrap.appendChild(cv);
    const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
    if (!gl) { wrap.classList.add('-fallback'); return; }
    img.dataset.liquidReady = '1';
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); } return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uT = U('t'), uM = U('mouse'), uMS = U('mouseStr'), uS = U('scale'), uA = U('amp'), uSeed = U('seed');
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    let iw = 1, ih = 1, ready = false;
    const upload = () => { try { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); iw = img.naturalWidth; ih = img.naturalHeight; ready = true; wrap.classList.add('-ready'); } catch (e) { wrap.classList.add('-fallback'); } };
    if (img.complete && img.naturalWidth) upload(); else img.addEventListener('load', upload, { once: true });
    img.addEventListener('liquid:swap', upload);
    const amp = parseFloat(img.dataset.liquid || '') || 0.006; gl.uniform1f(uA, amp); gl.uniform1f(uSeed, Math.random() * 10);
    let mouse = [0.5, 0.5], target = [0.5, 0.5], str = 0, tStr = 0, visible = true, t0 = performance.now();
    const resize = () => { const r = wrap.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 1.5); cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); gl.viewport(0, 0, cv.width, cv.height); };
    resize(); new ResizeObserver(resize).observe(wrap);
    wrap.addEventListener('pointermove', (e) => { const r = wrap.getBoundingClientRect(); target = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; tStr = 1; });
    wrap.addEventListener('pointerleave', () => { tStr = 0; });
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(wrap);
    const frame = () => {
      requestAnimationFrame(frame);
      if (!ready || !visible || document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      mouse[0] += (target[0] - mouse[0]) * 0.08; mouse[1] += (target[1] - mouse[1]) * 0.08; str += (tStr - str) * 0.06;
      const cr = cv.width / cv.height, ir = iw / ih; const sc = cr > ir ? [1, ir / cr] : [cr / ir, 1];
      gl.uniform1f(uT, t); gl.uniform2f(uM, mouse[0], mouse[1]); gl.uniform1f(uMS, str); gl.uniform2f(uS, sc[0], sc[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    if (!reduced) frame(); else wrap.classList.add('-fallback');
  }
  const init = () => document.querySelectorAll('img[data-liquid]').forEach(create);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.LiquidImage = { init, create };
})();
