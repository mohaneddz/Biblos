import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Layers,
  Image as ImageIcon,
  Sliders,
} from "lucide-react";

interface SpeciesViewer3DProps {
  imageUrl: string;
  name: string;
}

type ViewMode = "card" | "cutout";
type ViewerStatus = "idle" | "loading" | "ready" | "error";

interface StepProgress {
  label: string;
  percent: number;
}

/*──────────────────────────────────────────────────────────────────────────────
 * GLSL Shaders — clean parallax depth card
 *────────────────────────────────────────────────────────────────────────────*/

/**
 * Vertex shader: reads depth map and displaces vertices along their normals.
 * Depth map is generated from luminance + radial centre weighting.
 */
const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  uniform sampler2D uDepthMap;
  uniform float uDepthScale;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    float d = texture2D(uDepthMap, uv).r;
    vec3 displaced = position + normal * d * uDepthScale;

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

/**
 * Fragment shader: colour texture with alpha discard and rim glow.
 */
const FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  uniform sampler2D uTexture;
  uniform float uAlphaThreshold;

  void main() {
    vec4 texel = texture2D(uTexture, vUv);
    if (texel.a < uAlphaThreshold) discard;

    vec3 viewDir = normalize(-vViewPos);
    float rim = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    vec3 rimGlow = vec3(0.95, 0.78, 0.30) * pow(rim, 3.5) * 0.25;

    gl_FragColor = vec4(texel.rgb + rimGlow, texel.a);
  }
`;

/*──────────────────────────────────────────────────────────────────────────────
 * Image Utilities
 *────────────────────────────────────────────────────────────────────────────*/

/**
 * Fetch image as blob → create object URL → load <img>.
 * Keeps the blob URL alive (caller must revoke it).
 * Returns { img, blobUrl } so caller controls the lifecycle.
 */
async function fetchImageBlob(url: string): Promise<{ img: HTMLImageElement; blobUrl: string; rawBlob: Blob }> {
  let rawBlob: Blob;

  // If in Tauri environment, use native Rust fetch to bypass CORS completely
  if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const dataUrl = await invoke<string>("fetch_image_base64", { url });
      const res = await fetch(dataUrl);
      rawBlob = await res.blob();
    } catch (err) {
      console.warn("[3D Viewer] Native Tauri image fetch failed, fallback to web fetch:", err);
      const resp = await fetch(url, { mode: "cors", cache: "force-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} loading image`);
      rawBlob = await resp.blob();
    }
  } else {
    const resp = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} loading image`);
    rawBlob = await resp.blob();
  }

  const blobUrl = URL.createObjectURL(rawBlob);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Image element failed to load blob URL"));
    el.src = blobUrl;
  });

  return { img, blobUrl, rawBlob };
}

/**
 * Draws an image into a canvas at given resolution.
 * Returns whether the canvas is taint-free (readable).
 */
function imageToCanvas(
  img: HTMLImageElement,
  maxDim = 768
): { canvas: HTMLCanvasElement; clean: boolean } {
  const canvas = document.createElement("canvas");
  const nw = img.naturalWidth || 512;
  const nh = img.naturalHeight || 512;
  const scale = Math.min(1, maxDim / Math.max(nw, nh));
  canvas.width = Math.round(nw * scale);
  canvas.height = Math.round(nh * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let clean = true;
  try { ctx.getImageData(0, 0, 1, 1); } catch { clean = false; }
  return { canvas, clean };
}

/**
 * Build a smooth multi-layer depth map:
 *   - luminance contribution (brighter = closer)
 *   - radial centre proximity (centre = closer)
 *   - gaussian blur pass for smoothness
 *   - zeroes depth for transparent background pixels
 *
 * Result: grayscale canvas, white=close, black=far.
 */
function buildDepthMap(src: HTMLCanvasElement, isClean: boolean): HTMLCanvasElement {
  const SIZE = 256;
  const out = document.createElement("canvas");
  out.width = SIZE;
  out.height = SIZE;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;

  if (!isClean) {
    const grd = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
    grd.addColorStop(0, "#bbb");
    grd.addColorStop(1, "#444");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, SIZE, SIZE);
    return out;
  }

  ctx.drawImage(src, 0, 0, SIZE, SIZE);
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const px = imgData.data;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  // Pass 1: compute raw depth per pixel
  const raw = new Float32Array(SIZE * SIZE);
  let minV = 1, maxV = 0;

  for (let i = 0; i < px.length; i += 4) {
    const xi = (i / 4) % SIZE;
    const yi = Math.floor(i / 4 / SIZE);
    const alpha = px[i + 3];

    // Zero out depth for transparent background pixels
    if (alpha < 20) {
      raw[yi * SIZE + xi] = 0;
      continue;
    }

    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const distNorm = Math.sqrt((xi - cx) ** 2 + (yi - cy) ** 2) / maxDist;
    const centreBias = 1 - distNorm;

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

    const depth = luma * 0.35 + centreBias * 0.45 + sat * 0.2;
    raw[yi * SIZE + xi] = depth;
    if (depth < minV) minV = depth;
    if (depth > maxV) maxV = depth;
  }

  // Pass 2: normalise and write back
  const range = maxV - minV || 1;
  for (let i = 0; i < px.length; i += 4) {
    const idx = i / 4;
    const alpha = px[i + 3];
    if (alpha < 20) {
      px[i] = px[i + 1] = px[i + 2] = 0;
      px[i + 3] = 255;
    } else {
      const v = Math.round(((raw[idx] - minV) / range) * 255);
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Pass 3: blur for smoothness
  const blurred = document.createElement("canvas");
  blurred.width = SIZE;
  blurred.height = SIZE;
  const bCtx = blurred.getContext("2d")!;
  bCtx.filter = "blur(3px)";
  bCtx.drawImage(out, 0, 0, SIZE, SIZE);

  return blurred;
}

/**
 * Smart algorithmic background extraction fallback.
 * Used when AI model is offline or unavailable.
 * Samples border pixels to build a background color model, combines with center-salience,
 * and sets alpha to 0 for background pixels while preserving the main subject.
 */
function extractSubjectFallback(src: HTMLCanvasElement, isClean: boolean): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  if (!isClean) return out;

  try {
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const px = imgData.data;
    const w = out.width;
    const h = out.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxCenterDist = Math.sqrt(cx * cx + cy * cy);

    // 1. Sample border pixels
    const bgSamples: Array<[number, number, number]> = [];
    const stepX = Math.max(1, Math.floor(w / 32));
    const stepY = Math.max(1, Math.floor(h / 32));

    for (let x = 0; x < w; x += stepX) {
      const iTop = (0 * w + x) * 4;
      const iBot = ((h - 1) * w + x) * 4;
      bgSamples.push([px[iTop], px[iTop + 1], px[iTop + 2]]);
      bgSamples.push([px[iBot], px[iBot + 1], px[iBot + 2]]);
    }
    for (let y = 0; y < h; y += stepY) {
      const iLeft = (y * w + 0) * 4;
      const iRight = (y * w + (w - 1)) * 4;
      bgSamples.push([px[iLeft], px[iLeft + 1], px[iLeft + 2]]);
      bgSamples.push([px[iRight], px[iRight + 1], px[iRight + 2]]);
    }

    let avgR = 0, avgG = 0, avgB = 0;
    for (const [r, g, b] of bgSamples) {
      avgR += r; avgG += g; avgB += b;
    }
    avgR /= bgSamples.length;
    avgG /= bgSamples.length;
    avgB /= bgSamples.length;

    // 2. Classify each pixel
    for (let i = 0; i < px.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
      if (a < 10) continue;

      let minDist = 9999;
      for (const [br, bg, bb] of bgSamples) {
        const d = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
        if (d < minDist) minDist = d;
      }

      const avgDist = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);
      const effectiveBgDist = Math.min(minDist, avgDist);
      const centerDistNorm = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxCenterDist;

      const bgMatchThreshold = 45 + (1 - centerDistNorm) * 25;

      if (effectiveBgDist < bgMatchThreshold) {
        const matchFactor = 1 - (effectiveBgDist / bgMatchThreshold);
        const edgeWeight = Math.pow(centerDistNorm, 1.5);
        const alphaFactor = Math.max(0, 1 - matchFactor * (0.4 + 0.6 * edgeWeight));

        if (alphaFactor < 0.15) {
          px[i + 3] = 0;
        } else {
          px[i + 3] = Math.round(a * alphaFactor);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Apply edge fade to remove frame borders
    const d = ctx.getImageData(0, 0, w, h);
    const p = d.data;
    const innerR = Math.min(w, h) * 0.36;
    const outerR = Math.max(w, h) * 0.58;

    for (let i = 0; i < p.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist > innerR) {
        let t = Math.min(1, (dist - innerR) / (outerR - innerR));
        t = t * t * (3 - 2 * t);
        if (p[i + 3] < 220) {
          p[i + 3] = Math.round(p[i + 3] * (1 - t));
        }
      }
    }
    ctx.putImageData(d, 0, 0);
  } catch (e) {
    console.warn("[3D Viewer] Smart fallback extraction error:", e);
  }

  return out;
}

/*──────────────────────────────────────────────────────────────────────────────
 * Component
 *────────────────────────────────────────────────────────────────────────────*/

export function SpeciesViewer3D({ imageUrl, name }: SpeciesViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
    material: THREE.ShaderMaterial;
    rafId: number;
    materials: THREE.Material[];
    geometries: THREE.BufferGeometry[];
    textures: THREE.Texture[];
    resizeObserver?: ResizeObserver;
  } | null>(null);

  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [progress, setProgress] = useState<StepProgress>({ label: "", percent: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const [autoSpin, setAutoSpin] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cutout");
  const [depthScale, setDepthScale] = useState(0.4);
  const [aiSegmented, setAiSegmented] = useState(false);
  const [smartFallback, setSmartFallback] = useState(false);

  // Cached canvases for instant mode switching
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCleanRef = useRef(true);

  // Interaction
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(4.5);
  const autoSpinRef = useRef(autoSpin);
  useEffect(() => { autoSpinRef.current = autoSpin; }, [autoSpin]);

  /* ── Cleanup ─────────────────────────────────────────────────────────── */

  const dispose = useCallback(() => {
    const s = sceneRef.current;
    if (!s) return;
    cancelAnimationFrame(s.rafId);
    s.resizeObserver?.disconnect();
    s.materials.forEach((m) => m.dispose());
    s.geometries.forEach((g) => g.dispose());
    s.textures.forEach((t) => t.dispose());
    s.renderer.dispose();
    sceneRef.current = null;
  }, []);

  useEffect(() => dispose, [dispose]);

  /* ── Live depth scale update ─────────────────────────────────────────── */

  useEffect(() => {
    if (sceneRef.current?.material) {
      sceneRef.current.material.uniforms.uDepthScale.value = depthScale;
    }
  }, [depthScale]);

  /* ── Mode switching (instant, no reload) ─────────────────────────────── */

  const switchMode = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
    const s = sceneRef.current;
    if (!s) return;

    const sourceCanvas =
      newMode === "cutout"
        ? (cutoutCanvasRef.current ?? fullCanvasRef.current)
        : fullCanvasRef.current;
    if (!sourceCanvas) return;

    const depthCanvas = buildDepthMap(sourceCanvas, isCleanRef.current);
    const newTexture = new THREE.CanvasTexture(sourceCanvas);
    newTexture.colorSpace = THREE.SRGBColorSpace;
    const newDepth = new THREE.CanvasTexture(depthCanvas);

    s.material.uniforms.uTexture.value = newTexture;
    s.material.uniforms.uDepthMap.value = newDepth;
    s.material.uniforms.uAlphaThreshold.value = newMode === "card" ? 0.01 : 0.15;
    s.material.needsUpdate = true;
    s.textures.push(newTexture, newDepth);
  }, []);

  /* ── Main pipeline ───────────────────────────────────────────────────── */

  const generate = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current) return;
    dispose();
    setStatus("loading");
    setProgress({ label: "Fetching image…", percent: 5 });
    setErrorMsg("");
    setAiSegmented(false);
    setSmartFallback(false);
    fullCanvasRef.current = null;
    cutoutCanvasRef.current = null;

    let primaryBlobUrl: string | null = null;

    try {
      /* ── Step 1: Fetch & decode image ──────────────────────────────── */
      const { img: sourceImg, blobUrl, rawBlob } = await fetchImageBlob(imageUrl);
      primaryBlobUrl = blobUrl;

      const { canvas: sourceCanvas, clean: isClean } = imageToCanvas(sourceImg);
      fullCanvasRef.current = sourceCanvas;
      isCleanRef.current = isClean;

      setProgress({ label: "Computing depth map…", percent: 28 });

      /* ── Step 2: AI background removal (with smart fallback) ───────── */
      let cutoutCanvas: HTMLCanvasElement;
      let usedAI = false;
      let usedFallback = false;

      try {
        const { removeBackground } = await import("@imgly/background-removal");
        setProgress({ label: "Loading AI segmentation model…", percent: 33 });

        const resultBlob = await removeBackground(rawBlob, {
          publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.7.0/dist/",
          model: "isnet_quint8",
          output: { format: "image/png", quality: 0.95 },
          progress: (key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.min(88, 33 + Math.round((current / total) * 55));
              const label = String(key).includes("fetch")
                ? "Downloading AI model (first time only)…"
                : "Isolating subject with AI…";
              setProgress({ label, percent: pct });
            }
          },
        });

        const segBlobUrl = URL.createObjectURL(resultBlob);
        const segImg = await new Promise<HTMLImageElement>((res, rej) => {
          const el = new Image();
          el.onload = () => res(el);
          el.onerror = rej;
          el.src = segBlobUrl;
        });
        URL.revokeObjectURL(segBlobUrl);

        const { canvas: segCanvas } = imageToCanvas(segImg);
        cutoutCanvas = segCanvas;
        usedAI = true;
      } catch (bgErr) {
        console.warn("[3D Viewer] Primary AI BG removal failed, retrying default CDN...", bgErr);
        try {
          const { removeBackground } = await import("@imgly/background-removal");
          const resultBlob = await removeBackground(rawBlob, {
            output: { format: "image/png", quality: 0.95 }
          });
          const segBlobUrl = URL.createObjectURL(resultBlob);
          const segImg = await new Promise<HTMLImageElement>((res, rej) => {
            const el = new Image();
            el.onload = () => res(el);
            el.onerror = rej;
            el.src = segBlobUrl;
          });
          URL.revokeObjectURL(segBlobUrl);

          const { canvas: segCanvas } = imageToCanvas(segImg);
          cutoutCanvas = segCanvas;
          usedAI = true;
        } catch (secErr) {
          console.warn("[3D Viewer] Secondary AI BG removal failed → applying smart extraction fallback", secErr);
          cutoutCanvas = extractSubjectFallback(sourceCanvas, isClean);
          usedFallback = true;
        }
      }

      cutoutCanvasRef.current = cutoutCanvas;
      setAiSegmented(usedAI);
      setSmartFallback(usedFallback);

      // Default to cutout mode
      const initialMode: ViewMode = "cutout";
      setViewMode(initialMode);

      if (primaryBlobUrl) {
        URL.revokeObjectURL(primaryBlobUrl);
        primaryBlobUrl = null;
      }

      setProgress({ label: "Building 3D scene…", percent: 90 });

      /* ── Step 3: Build Three.js scene ─────────────────────────────── */
      const activeCanvas = initialMode === "cutout" ? cutoutCanvas : sourceCanvas;
      const depthCanvas = buildDepthMap(activeCanvas, isClean);

      const container = containerRef.current!;
      const W = container.clientWidth || 580;
      const H = container.clientHeight || 440;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
      camera.position.set(0, 0, targetZoom.current);
      camera.lookAt(0, 0, 0);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const e of entries) {
          const w = e.contentRect.width;
          const h = e.contentRect.height || 440;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
      });
      resizeObserver.observe(container);

      const group = new THREE.Group();
      scene.add(group);

      // ── Subject texture ──
      const subjectTexture = new THREE.CanvasTexture(activeCanvas);
      subjectTexture.colorSpace = THREE.SRGBColorSpace;
      subjectTexture.minFilter = THREE.LinearMipMapLinearFilter;
      subjectTexture.magFilter = THREE.LinearFilter;
      subjectTexture.generateMipmaps = true;

      const depthTexture = new THREE.CanvasTexture(depthCanvas);
      depthTexture.minFilter = THREE.LinearFilter;
      depthTexture.magFilter = THREE.LinearFilter;

      // ── Subject mesh ──
      const aspect = activeCanvas.width / activeCanvas.height;
      const planeH = 2.2;
      const planeW = planeH * aspect;
      const planeGeo = new THREE.PlaneGeometry(planeW, planeH, 192, 192);

      const subjectMat = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: subjectTexture },
          uDepthMap: { value: depthTexture },
          uDepthScale: { value: depthScale },
          uAlphaThreshold: { value: 0.15 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const subjectMesh = new THREE.Mesh(planeGeo, subjectMat);
      subjectMesh.position.y = 0.12;
      group.add(subjectMesh);

      // ── Pedestal ──
      const baseR = Math.max(planeW, planeH) * 0.52;
      const baseGeo = new THREE.CylinderGeometry(baseR, baseR * 1.1, 0.08, 72);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1c1e1c,
        metalness: 0.9,
        roughness: 0.18,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -planeH / 2 - 0.04;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      const ringGeo = new THREE.TorusGeometry(baseR * 1.04, 0.018, 16, 96);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.95,
        roughness: 0.1,
        emissive: new THREE.Color(0xeab308),
        emissiveIntensity: 0.15,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = baseMesh.position.y + 0.05;
      group.add(ringMesh);

      // ── Lighting ──
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));

      const key = new THREE.DirectionalLight(0xfff5e0, 1.6);
      key.position.set(4, 5, 6);
      key.castShadow = true;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x8899cc, 0.45);
      fill.position.set(-4, 1, 3);
      scene.add(fill);

      const rim = new THREE.PointLight(0xeab308, 0.8, 14);
      rim.position.set(-2, -1.5, 2.5);
      scene.add(rim);

      const materials: THREE.Material[] = [subjectMat, baseMat, ringMat];
      const geometries: THREE.BufferGeometry[] = [planeGeo, baseGeo, ringGeo];
      const textures: THREE.Texture[] = [subjectTexture, depthTexture];

      // ── Animation ──
      let spinAngle = 0;
      let rafId = 0;

      const animate = () => {
        rafId = requestAnimationFrame(animate);

        if (autoSpinRef.current && !isDragging.current) {
          spinAngle += 0.005;
          group.rotation.y += (Math.sin(spinAngle) * 0.35 - group.rotation.y) * 0.025;
          group.rotation.x += (0 - group.rotation.x) * 0.04;
        } else {
          group.rotation.y += (targetRotation.current.y - group.rotation.y) * 0.1;
          group.rotation.x += (targetRotation.current.x - group.rotation.x) * 0.1;
        }

        camera.position.z += (targetZoom.current - camera.position.z) * 0.1;
        renderer.render(scene, camera);
      };
      animate();

      sceneRef.current = {
        renderer, scene, camera, group, material: subjectMat,
        rafId, materials, geometries, textures, resizeObserver,
      };

      setProgress({ label: "Done!", percent: 100 });
      setStatus("ready");

    } catch (err) {
      if (primaryBlobUrl) URL.revokeObjectURL(primaryBlobUrl);
      console.error("[3D Viewer] Pipeline failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
    }
  }, [imageUrl, dispose, depthScale]);

  /* ── Pointer / wheel ─────────────────────────────────────────────────── */

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    setAutoSpin(false);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    targetRotation.current.y += dx * 0.007;
    targetRotation.current.x = Math.max(-0.75, Math.min(0.75, targetRotation.current.x + dy * 0.007));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    targetZoom.current = Math.max(2.5, Math.min(9, targetZoom.current + e.deltaY * 0.005));
  }, []);

  const resetView = useCallback(() => {
    targetRotation.current = { x: 0, y: 0 };
    targetZoom.current = 4.5;
    setAutoSpin(true);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">

      {/* ── Idle ─────────────────────────────────────────────────────── */}
      {status === "idle" && (
        <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-app-accent/30 bg-app-accent/10 text-app-accent shadow-[0_0_24px_rgba(234,179,8,0.15)]">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
            </svg>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Interactive 3D Depth Model</h4>
            <p className="mt-1 text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
              Builds a WebGL depth-displaced 3D model from the species photo, with optional AI background isolation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generate()}
            className="flex items-center gap-2 rounded-xl border border-app-accent/40 bg-app-accent/15 px-6 py-2.5 text-sm font-semibold text-app-accent hover:bg-app-accent/25 active:scale-95 transition cursor-pointer shadow-lg"
          >
            <Play className="h-4 w-4" />
            Generate 3D Model
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-5 py-10 px-6 text-center max-w-sm mx-auto">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-12 w-12 text-app-accent animate-spin" />
            <span className="absolute text-[11px] font-bold text-white tabular-nums">{progress.percent}%</span>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-app-soft font-medium">
              <span className="truncate pr-2">{progress.label}</span>
              <span className="shrink-0 font-semibold text-app-accent">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-app-accent/70 via-app-accent to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${Math.max(6, progress.percent)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-app-muted leading-relaxed">
            All processing happens on-device — nothing is uploaded.
          </p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center space-y-2">
          <p className="text-sm text-red-400 font-medium">Failed to generate 3D model</p>
          <p className="text-xs text-app-muted break-all">{errorMsg}</p>
          <button
            type="button"
            onClick={() => void generate()}
            className="text-xs text-app-accent hover:underline font-medium cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── 3D Canvas ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] ${
          status === "ready" ? "block" : "hidden"
        }`}
        style={{ height: 440 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        />

        {/* Top toolbar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1 rounded-full bg-black/70 border border-app-accent/30 text-xs text-app-accent font-semibold backdrop-blur-md">
              {name}
            </div>
            {/* Mode switcher */}
            <div className="flex items-center p-0.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-md">
              <button
                type="button"
                onClick={() => switchMode("card")}
                title="Full photo as 3D relief card (most reliable)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  viewMode === "card" ? "bg-app-accent text-black font-semibold" : "text-app-soft hover:text-white"
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                <span>3D Card</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("cutout")}
                title="Background-isolated cutout in 3D space"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  viewMode === "cutout" ? "bg-app-accent text-black font-semibold" : "text-app-soft hover:text-white"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Cutout{aiSegmented ? " ✦AI" : smartFallback ? " ✦Smart" : ""}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Depth control */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 border border-white/15 backdrop-blur-md text-xs text-app-soft">
              <Sliders className="h-3 w-3 text-app-accent shrink-0" />
              <span className="text-[10px] font-medium mr-0.5">Depth</span>
              {([["Lo", 0.2], ["Mid", 0.4], ["Hi", 0.65]] as [string, number][]).map(([lbl, val]) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setDepthScale(val)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition ${
                    depthScale === val ? "bg-white/25 text-white" : "hover:text-white"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {/* Re-generate */}
            <button
              type="button"
              onClick={() => void generate()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/15 text-xs text-app-soft hover:text-white hover:bg-white/15 backdrop-blur-md transition cursor-pointer font-medium"
            >
              <RotateCw className="h-3 w-3" />
              <span className="hidden sm:inline">Re-generate</span>
            </button>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
          {[
            { title: autoSpin ? "Pause" : "Spin", icon: autoSpin ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />, action: () => setAutoSpin((v) => !v) },
            { title: "Zoom in",  icon: <ZoomIn  className="h-3.5 w-3.5" />, action: () => { targetZoom.current = Math.max(2.5, targetZoom.current - 0.7); } },
            { title: "Zoom out", icon: <ZoomOut className="h-3.5 w-3.5" />, action: () => { targetZoom.current = Math.min(9, targetZoom.current + 0.7); } },
            { title: "Rotate L", icon: <RotateCcw className="h-3.5 w-3.5" />, action: () => { setAutoSpin(false); targetRotation.current.y -= 0.5; } },
            { title: "Rotate R", icon: <RotateCw  className="h-3.5 w-3.5" />, action: () => { setAutoSpin(false); targetRotation.current.y += 0.5; } },
          ].map(({ title, icon, action }) => (
            <button
              key={title}
              type="button"
              title={title}
              onClick={action}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md text-white border border-white/20 transition cursor-pointer hover:text-app-accent"
            >
              {icon}
            </button>
          ))}
          <button
            type="button"
            onClick={resetView}
            className="flex h-8 items-center px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md text-white border border-white/20 transition cursor-pointer text-xs font-semibold hover:text-app-accent"
          >
            Reset
          </button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-3 left-3 text-[11px] text-app-muted/60 select-none pointer-events-none flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Drag · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
