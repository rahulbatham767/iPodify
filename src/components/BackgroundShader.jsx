import { useEffect, useRef } from 'react'

// Port of the radar-pulse WebGL shader from code.html (STITCH_SHADER markers).
export function BackgroundShader() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function syncSize() {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    let ro
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize)
      ro.observe(canvas)
    }
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Base dark background
    vec3 color = vec3(0.04, 0.05, 0.08); 
    
    // Radar grid
    float grid = 0.0;
    grid += smoothstep(0.98, 1.0, 1.0 - abs(sin(uv.x * 10.0)));
    grid += smoothstep(0.98, 1.0, 1.0 - abs(sin(uv.y * 10.0)));
    color += grid * vec3(0.0, 0.2, 0.4) * 0.2;
    
    // Pulsing radar circles
    float dist = length(uv);
    for(float i = 0.0; i < 3.0; i++) {
        float pulse = fract(u_time * 0.2 + i * 0.33);
        float circle = smoothstep(0.02, 0.0, abs(dist - pulse * 1.5));
        color += circle * vec3(0.0, 0.5, 1.0) * (1.0 - pulse);
    }
    
    // Scan line
    float angle = atan(uv.y, uv.x);
    float scan = smoothstep(0.1, 0.0, abs(fract(angle / 6.28 + u_time * 0.15) - 0.5) * 2.0);
    color += scan * vec3(0.0, 0.3, 0.6) * exp(-dist * 2.0);

    gl_FragColor = vec4(color, 1.0);
}`
    function cs(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    const onMouse = (event) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', onMouse)

    let raf
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      ro && ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-40" />
}