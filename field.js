/* Campo de partículas en WebGL: una sola masa de puntos que pasa del desorden al logo de Kuantis.
   Formas, en orden: 0 desorden · 1 cadena · 2 ondas · 3 estructura · 4 logo. */
(function () {
  'use strict';

  const canvas = document.getElementById('field');
  const state = {
    p: 0, cool: 0, noise: 0.045, dim: 1, scale: 1, offX: 0, offY: 0,
    bg: [8 / 255, 9 / 255, 15 / 255], visible: true
  };
  const api = { state, ok: false, ripple() {}, render() {} };
  window.KField = api;
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.style.display = 'none'; return; }

  const mobile = window.innerWidth < 760;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COUNT = mobile ? 13000 : 34000;
  let drawCount = COUNT;
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  // El punto de partida: hilos enredados, como el trabajo que pasa de mano en mano.
  function chaos() {
    const o = new Float32Array(COUNT * 3);
    const asp = window.innerWidth / window.innerHeight;
    // Un nudo apretado arriba a la derecha, sobre el espacio libre que deja el titular…
    const knotX = mobile ? asp * 0.28 : asp * 0.52;
    const knotY = mobile ? 0.62 : 0.5;
    const knotW = mobile ? asp * 0.62 : 0.72;
    const knotH = mobile ? 0.26 : 0.42;
    const knot = [];
    for (let k = 0; k < (mobile ? 9 : 12); k++) {
      knot.push({
        ax: knotW * rand(0.55, 1), fx: rand(1, 2.2), px: rand(0, 6.28), bx: knotW * rand(0.1, 0.35), gx: rand(2.4, 4.5), qx: rand(0, 6.28),
        ay: knotH * rand(0.55, 1), fy: rand(1, 2.4), py: rand(0, 6.28), by: knotH * rand(0.1, 0.4), gy: rand(2.5, 5), qy: rand(0, 6.28),
        cx: knotX, cy: knotY, fz: rand(0.8, 2.2)
      });
    }
    // …y hilos largos que salen de él y cruzan la pantalla.
    const loose = [];
    for (let k = 0; k < (mobile ? 5 : 8); k++) {
      loose.push({
        ax: asp * rand(0.9, 1.5), fx: rand(0.3, 0.8), px: rand(0, 6.28), bx: rand(0.2, 0.6), gx: rand(1.4, 2.6), qx: rand(0, 6.28),
        ay: rand(0.45, 1.05), fy: rand(0.4, 1), py: rand(0, 6.28), by: rand(0.1, 0.3), gy: rand(1.6, 3), qy: rand(0, 6.28),
        cx: knotX * 0.45, cy: knotY * 0.3, fz: rand(0.5, 1.4)
      });
    }
    for (let i = 0; i < COUNT; i++) {
      const pool = Math.random() < 0.62 ? knot : loose;
      const h = pool[Math.floor(Math.random() * pool.length)];
      const t = Math.random() * Math.PI * 2;
      const spread = Math.random() < 0.05 ? 0.07 : 0.007;
      o[i * 3] = h.cx + h.ax * Math.sin(h.fx * t + h.px) + h.bx * Math.sin(h.gx * t + h.qx) + gauss() * spread;
      o[i * 3 + 1] = h.cy + h.ay * Math.sin(h.fy * t + h.py) + h.by * Math.sin(h.gy * t + h.qy) + gauss() * spread;
      o[i * 3 + 2] = Math.sin(h.fz * t + h.px) * 0.8;
    }
    return o;
  }

  // Grupos de personas a lo largo de una cadena: el último, quien ejecuta, es el más grande.
  function chain() {
    const o = new Float32Array(COUNT * 3);
    const nodes = 7;
    const at = (t) => [-0.92 + 1.84 * t, Math.sin(t * Math.PI * 1.5) * 0.42 - 0.08];
    for (let i = 0; i < COUNT; i++) {
      if (Math.random() < 0.16) {
        const t = Math.random();
        const [x, y] = at(t);
        o[i * 3] = x; o[i * 3 + 1] = y; o[i * 3 + 2] = rand(-0.02, 0.02);
      } else {
        const n = Math.pow(Math.random(), 0.65);
        const k = Math.min(nodes - 1, Math.floor(n * nodes));
        const t = k / (nodes - 1);
        const [x, y] = at(t);
        const r = 0.05 + 0.2 * t * t;
        o[i * 3] = x + gauss() * r; o[i * 3 + 1] = y + gauss() * r; o[i * 3 + 2] = gauss() * r;
      }
    }
    return o;
  }

  // Ondas que escuchan alrededor de un único punto de decisión.
  function rings() {
    const o = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      if (Math.random() < 0.14) {
        const r = Math.pow(Math.random(), 1.6) * 0.1;
        o[i * 3] = Math.cos(a) * r; o[i * 3 + 1] = Math.sin(a) * r; o[i * 3 + 2] = gauss() * 0.06;
      } else {
        const ring = 1 + Math.floor(Math.random() * 5);
        const r = ring * 0.2 + gauss() * 0.008;
        const tilt = 0.62;
        o[i * 3] = Math.cos(a) * r;
        o[i * 3 + 1] = Math.sin(a) * r * tilt;
        o[i * 3 + 2] = Math.sin(a) * r * 0.75;
      }
    }
    return o;
  }

  // Tres planos conectados: el sistema ya tiene forma.
  function lattice() {
    const o = new Float32Array(COUNT * 3);
    const cells = 6, size = 1.1;
    const g = (n) => -size / 2 + (size * n) / cells;
    for (let i = 0; i < COUNT; i++) {
      const layer = [-0.55, 0, 0.55][Math.floor(Math.random() * 3)];
      let x, y, z;
      if (Math.random() < 0.1) {
        x = g(Math.floor(Math.random() * (cells + 1)));
        z = g(Math.floor(Math.random() * (cells + 1)));
        y = rand(-0.55, 0.55);
      } else {
        const line = Math.floor(Math.random() * (cells + 1));
        const along = rand(-size / 2, size / 2);
        if (Math.random() < 0.5) { x = g(line); z = along; } else { x = along; z = g(line); }
        y = layer;
      }
      // Vista isométrica para que se lean los tres planos.
      const ry = 0.72, rx = 0.62;
      const x1 = x * Math.cos(ry) + z * Math.sin(ry);
      const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      o[i * 3] = x1 * 1.12; o[i * 3 + 1] = y2 * 1.12; o[i * 3 + 2] = z2;
    }
    return o;
  }

  // El logo se muestrea a partir de sus cuatro piezas.
  function logo() {
    const S = 320, c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    const pieces = [
      [[342, 450], [375, 382], [490, 310], [500, 320], [500, 595], [342, 762]],
      [[500, 597], [500, 900], [490, 910], [375, 850], [344, 800], [375, 722]],
      [[502, 597], [745, 402], [805, 380], [945, 380], [745, 570], [680, 597]],
      [[527, 648], [680, 648], [752, 682], [945, 877], [800, 877], [725, 845]]
    ];
    const map = (v) => ((v - 640 + 400) / 800) * S; // el logo mide unos 600 px de alto sobre 1254
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.lineJoin = 'round';
    pieces.forEach((p) => {
      x.beginPath();
      p.forEach(([a, b], i) => (i ? x.lineTo(map(a), map(b + 30)) : x.moveTo(map(a), map(b + 30))));
      x.closePath(); x.fill(); x.stroke();
    });
    const data = x.getImageData(0, 0, S, S).data;
    const o = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      let px, py, tries = 0;
      do { px = Math.floor(Math.random() * S); py = Math.floor(Math.random() * S); tries++; }
      while (data[(py * S + px) * 4 + 3] < 128 && tries < 60);
      o[i * 3] = (px / S - 0.5) * 2.6;
      o[i * 3 + 1] = -(py / S - 0.5) * 2.6;
      o[i * 3 + 2] = gauss() * 0.09;
    }
    return o;
  }

  const VS = `
    attribute vec3 aA; attribute vec3 aB; attribute vec4 aSeed;
    uniform float uT, uTime, uNoise, uCool, uAspect, uScale, uPx, uDim, uRy, uRx;
    uniform vec2 uOff, uMouse; uniform vec3 uRipple;
    varying vec3 vC; varying float vA;
    void main() {
      float t = clamp(uT * 1.5 - aSeed.x * 0.5, 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);
      vec3 P = mix(aA, aB, t);
      float swirl = sin(t * 3.14159);
      float amp = uNoise + swirl * 0.26;
      float ph = aSeed.y * 6.2831;
      // La onda depende sobre todo del lugar, para que un hilo se mueva como una sola pieza.
      float loose = ph * (0.06 + swirl * 0.9);
      P.x += (sin(P.y * 1.7 + uTime * 0.42 + loose) + sin(P.z * 2.3 + uTime * 0.53 + loose * 0.5)) * amp;
      P.y += (cos(P.x * 1.3 - uTime * 0.36 + loose) + sin(P.z * 1.9 - uTime * 0.47)) * amp;
      P.z += sin(P.x * 1.1 + uTime * 0.3 + loose) * amp;
      float cy = cos(uRy), sy = sin(uRy), cx = cos(uRx), sx = sin(uRx);
      P = vec3(P.x * cy + P.z * sy, P.y, -P.x * sy + P.z * cy);
      P = vec3(P.x, P.y * cx - P.z * sx, P.y * sx + P.z * cx);
      float w = 1.0 + P.z * 0.32 * uScale;
      vec2 q = P.xy * uScale / w + uOff;
      vec2 d = q - uMouse;
      float m = exp(-dot(d, d) / 0.045);
      q += normalize(d + 0.0001) * m * 0.16;
      if (uRipple.z > 0.0) {
        vec2 rd = q - uRipple.xy;
        float rl = length(rd);
        float front = uRipple.z * 1.5;
        float wave = exp(-pow((rl - front) / 0.14, 2.0)) * exp(-uRipple.z * 1.7);
        q += normalize(rd + 0.0001) * wave * 0.2;
      }
      gl_Position = vec4(q.x / uAspect, q.y, 0.0, 1.0);
      gl_PointSize = aSeed.w * uPx / max(w, 0.35);
      vec3 warmA = vec3(0.2, 0.42, 1.0), warmB = vec3(0.36, 0.86, 1.0);
      vec3 warm = mix(warmA, warmB, aSeed.z);
      float g = clamp((aA.y * (1.0 - t) + aB.y * t) * 0.65 + (aA.x * (1.0 - t) + aB.x * t) * 0.2 + 0.5, 0.0, 1.0);
      vec3 cool = mix(vec3(0.5, 0.22, 1.0), mix(vec3(0.16, 0.33, 1.0), vec3(0.28, 0.85, 1.0), smoothstep(0.5, 1.0, g)), smoothstep(0.0, 0.55, g));
      vC = mix(warm, cool, smoothstep(aSeed.x * 0.5, 0.5 + aSeed.x * 0.5, uCool));
      vA = uDim * (0.3 + aSeed.y * 0.55);
    }`;
  const FS = `
    precision mediump float; varying vec3 vC; varying float vA;
    void main() {
      float r = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.05, r);
      gl_FragColor = vec4(vC, a * a * vA);
    }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  const buffers = [chaos(), chain(), rings(), lattice(), logo()].map((data) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  });
  const seeds = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = rand(1.1, 2.9) * (Math.random() < 0.02 ? 2.1 : 1);
  }
  const seedBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

  const A = {
    a: gl.getAttribLocation(prog, 'aA'),
    b: gl.getAttribLocation(prog, 'aB'),
    s: gl.getAttribLocation(prog, 'aSeed')
  };
  const U = {};
  ['uT', 'uTime', 'uNoise', 'uCool', 'uAspect', 'uScale', 'uPx', 'uDim', 'uRy', 'uRx', 'uOff', 'uMouse', 'uRipple']
    .forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  gl.enableVertexAttribArray(A.a);
  gl.enableVertexAttribArray(A.b);
  gl.enableVertexAttribArray(A.s);
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.vertexAttribPointer(A.s, 4, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let W = 0, H = 0, DPR = 1, aspect = 1;
  function resize() {
    // Mide el lienzo, no la ventana: así la barra del navegador del celular no lo deforma al bajar.
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (nw === W && nh === H) return;
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
    W = nw;
    H = nh;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    aspect = W / H;
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (reduce) draw(0);
  }

  const mouse = { x: 9, y: 9, tx: 9, ty: 9, rx: 0, ry: 0 };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.tx = ((e.clientX / W) * 2 - 1) * aspect;
    mouse.ty = -((e.clientY / H) * 2 - 1);
  }, { passive: true });
  window.addEventListener('pointerleave', () => { mouse.tx = 9; mouse.ty = 9; });

  const ripple = { x: 0, y: 0, born: -10 };
  api.ripple = (cx, cy) => {
    ripple.x = ((cx / W) * 2 - 1) * aspect;
    ripple.y = -((cy / H) * 2 - 1);
    ripple.born = performance.now() / 1000;
  };

  let shown = -1;
  function bindShapes() {
    const i = Math.min(Math.floor(state.p), buffers.length - 2);
    if (i === shown) return i;
    shown = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
    gl.vertexAttribPointer(A.a, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i + 1]);
    gl.vertexAttribPointer(A.b, 3, gl.FLOAT, false, 0, 0);
    return i;
  }

  function draw(now) {
    const time = reduce ? 12 : now;
    const i = bindShapes();
    const T = Math.min(1, state.p - i);
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    const hasMouse = Math.abs(mouse.tx) < 8;
    const tRy = hasMouse ? (mouse.tx / Math.max(aspect, 1)) * 0.22 : 0;
    const tRx = hasMouse ? mouse.ty * -0.14 : 0;
    mouse.ry += (tRy - mouse.ry) * 0.05;
    mouse.rx += (tRx - mouse.rx) * 0.05;
    const spin = reduce ? 0.3 : Math.sin(now * 0.14) * 0.26;
    const ordered = Math.min(1, state.p);

    gl.clearColor(state.bg[0], state.bg[1], state.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uT, T);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uNoise, state.noise);
    gl.uniform1f(U.uCool, state.cool);
    gl.uniform1f(U.uAspect, aspect);
    gl.uniform1f(U.uScale, state.scale);
    gl.uniform1f(U.uPx, DPR * (mobile ? 1.1 : 1.25));
    gl.uniform1f(U.uDim, state.dim);
    gl.uniform1f(U.uRy, (spin * ordered + mouse.ry));
    gl.uniform1f(U.uRx, mouse.rx);
    gl.uniform2f(U.uOff, state.offX * aspect, state.offY);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    const age = now - ripple.born;
    gl.uniform3f(U.uRipple, ripple.x, ripple.y, age < 2.2 ? age : 0);
    gl.drawArrays(gl.POINTS, 0, drawCount);
  }

  // Si el equipo no da abasto, se dibujan menos puntos en lugar de perder fluidez.
  let last = 0, slow = 0, frames = 0;
  function loop(ms) {
    requestAnimationFrame(loop);
    if (!state.visible || document.hidden) { last = ms; return; }
    const dt = ms - last;
    last = ms;
    frames++;
    if (frames > 40 && dt < 200) {
      slow = dt > 30 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 30 && drawCount > COUNT * 0.3) { drawCount = Math.floor(drawCount * 0.75); slow = 0; }
    }
    draw(ms / 1000);
  }

  api.ok = true;
  api.render = () => draw(performance.now() / 1000);
  window.addEventListener('resize', resize);
  resize();
  if (reduce) draw(0); else requestAnimationFrame(loop);
})();
