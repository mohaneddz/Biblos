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
  Box,
  Sparkles,
} from "lucide-react";
import { generateTripoSRMesh, MeshData } from "../services/triposrService";

interface SpeciesViewer3DProps {
  imageUrl: string;
  name: string;
}

type ViewMode = "triposr" | "cutout" | "card";
type ViewerStatus = "idle" | "loading" | "ready" | "error";

interface StepProgress {
  label: string;
  percent: number;
}

/*──────────────────────────────────────────────────────────────────────────────
 * GLSL Shaders — clean parallax depth card
 *────────────────────────────────────────────────────────────────────────────*/

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

async function fetchImageBlob(url: string): Promise<{ img: HTMLImageElement; blobUrl: string; rawBlob: Blob }> {
  let rawBlob: Blob;

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

  const raw = new Float32Array(SIZE * SIZE);
  let minV = 1, maxV = 0;

  for (let i = 0; i < px.length; i += 4) {
    const xi = (i / 4) % SIZE;
    const yi = Math.floor(i / 4 / SIZE);
    const alpha = px[i + 3];

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

  const blurred = document.createElement("canvas");
  blurred.width = SIZE;
  blurred.height = SIZE;
  const bCtx = blurred.getContext("2d")!;
  bCtx.filter = "blur(3px)";
  bCtx.drawImage(out, 0, 0, SIZE, SIZE);

  return blurred;
}

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

    for (let i = 0; i < px.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      const alpha = px[i + 3];
      if (alpha < 10) continue;

      const normDist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / Math.sqrt(cx * cx + cy * cy);
      if (normDist > 0.48) {
        const edgeFade = Math.max(0, 1 - (normDist - 0.48) / 0.12);
        px[i + 3] = Math.round(alpha * edgeFade);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn("[3D Viewer] Subject extraction fallback error:", e);
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
    cardMesh: THREE.Mesh;
    triposrMesh?: THREE.Mesh;
    cardMaterial: THREE.ShaderMaterial;
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
  const [viewMode, setViewMode] = useState<ViewMode>("triposr");
  const [depthScale, setDepthScale] = useState(0.4);
  const [aiSegmented, setAiSegmented] = useState(false);
  const [smartFallback, setSmartFallback] = useState(false);

  // Cached canvases
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
    if (sceneRef.current?.cardMaterial) {
      sceneRef.current.cardMaterial.uniforms.uDepthScale.value = depthScale;
    }
  }, [depthScale]);

  /* ── Mode switching ──────────────────────────────────────────────────── */

  const switchMode = useCallback(async (newMode: ViewMode) => {
    setViewMode(newMode);
    const s = sceneRef.current;
    if (!s) return;

    if (newMode === "triposr") {
      if (s.triposrMesh) {
        s.triposrMesh.visible = true;
        s.cardMesh.visible = false;
      }
    } else {
      if (s.triposrMesh) s.triposrMesh.visible = false;
      s.cardMesh.visible = true;

      const sourceCanvas =
        newMode === "cutout"
          ? (cutoutCanvasRef.current ?? fullCanvasRef.current)
          : fullCanvasRef.current;
      if (!sourceCanvas) return;

      const depthCanvas = buildDepthMap(sourceCanvas, isCleanRef.current);
      const newTexture = new THREE.CanvasTexture(sourceCanvas);
      newTexture.colorSpace = THREE.SRGBColorSpace;
      const newDepth = new THREE.CanvasTexture(depthCanvas);

      s.cardMaterial.uniforms.uTexture.value = newTexture;
      s.cardMaterial.uniforms.uDepthMap.value = newDepth;
      s.cardMaterial.uniforms.uAlphaThreshold.value = newMode === "card" ? 0.01 : 0.15;
      s.cardMaterial.needsUpdate = true;
      s.textures.push(newTexture, newDepth);
    }
  }, []);

  /* ── Main pipeline ───────────────────────────────────────────────────── */

  const generate = useCallback(async (targetMode: ViewMode = "triposr") => {
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

      setProgress({ label: "Computing depth map…", percent: 18 });

      /* ── Step 2: AI background removal ──────────────────────────────── */
      let cutoutCanvas: HTMLCanvasElement;
      let usedAI = false;
      let usedFallback = false;

      try {
        const { removeBackground } = await import("@imgly/background-removal");
        setProgress({ label: "Loading AI background removal…", percent: 22 });

        let resultBlob: Blob;
        const imglyConfig = {
          publicPath: "https://static.imgly.com/@imgly/background-removal-data/1.7.0/dist/",
          output: { format: "image/png" as const, quality: 0.95 },
        };
        try {
          resultBlob = await removeBackground(rawBlob, {
            ...imglyConfig,
            progress: (_key: string, current: number, total: number) => {
              if (total > 0) {
                const pct = Math.min(45, 22 + Math.round((current / total) * 23));
                setProgress({ label: "Isolating species cutout with AI…", percent: pct });
              }
            },
          });
        } catch {
          resultBlob = await removeBackground(sourceCanvas.toDataURL("image/png"), imglyConfig);
        }

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
        console.warn("[3D Viewer] AI BG removal fallback triggered:", bgErr);
        cutoutCanvas = extractSubjectFallback(sourceCanvas, isClean);
        usedFallback = true;
      }

      cutoutCanvasRef.current = cutoutCanvas;
      setAiSegmented(usedAI);
      setSmartFallback(usedFallback);

      if (primaryBlobUrl) {
        URL.revokeObjectURL(primaryBlobUrl);
        primaryBlobUrl = null;
      }

      /* ── Step 3: Build Three.js base scene ──────────────────────────── */
      const activeCanvas = cutoutCanvas;
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

      const subjectTexture = new THREE.CanvasTexture(activeCanvas);
      subjectTexture.colorSpace = THREE.SRGBColorSpace;
      const depthTexture = new THREE.CanvasTexture(depthCanvas);

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

      const cardMesh = new THREE.Mesh(planeGeo, subjectMat);
      cardMesh.position.y = 0.12;
      cardMesh.visible = targetMode !== "triposr";
      group.add(cardMesh);

      // Pedestal
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

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.85));

      const key = new THREE.DirectionalLight(0xfff5e0, 1.8);
      key.position.set(4, 5, 6);
      key.castShadow = true;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x8899cc, 0.65);
      fill.position.set(-4, 1, 3);
      scene.add(fill);

      const rim = new THREE.PointLight(0xeab308, 0.9, 14);
      rim.position.set(-2, -1.5, 2.5);
      scene.add(rim);

      const materials: THREE.Material[] = [subjectMat, baseMat, ringMat];
      const geometries: THREE.BufferGeometry[] = [planeGeo, baseGeo, ringGeo];
      const textures: THREE.Texture[] = [subjectTexture, depthTexture];

      let triposrMesh: THREE.Mesh | undefined;

      /* ── Step 4: TripoSR 3D Mesh Generation ─────────────────────────── */
      if (targetMode === "triposr") {
        try {
          const meshData: MeshData = await generateTripoSRMesh(
            cutoutCanvas,
            (prog) => setProgress({ label: prog.label, percent: Math.max(48, prog.percent) }),
            64
          );

          const triposrGeo = new THREE.BufferGeometry();
          triposrGeo.setAttribute("position", new THREE.BufferAttribute(meshData.positions, 3));
          triposrGeo.setAttribute("normal", new THREE.BufferAttribute(meshData.normals, 3));
          triposrGeo.setAttribute("color", new THREE.BufferAttribute(meshData.colors, 3));

          triposrGeo.center();
          triposrGeo.computeBoundingSphere();
          const radius = triposrGeo.boundingSphere?.radius || 1.0;
          if (!isNaN(radius) && radius > 1e-4) {
            const targetScale = 1.6 / radius;
            triposrGeo.scale(targetScale, targetScale, targetScale);
          }

          const triposrMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.35,
            metalness: 0.15,
            side: THREE.DoubleSide,
          });

          triposrMesh = new THREE.Mesh(triposrGeo, triposrMat);
          triposrMesh.position.y = 0.05;
          triposrMesh.castShadow = true;
          triposrMesh.receiveShadow = true;
          group.add(triposrMesh);

          materials.push(triposrMat);
          geometries.push(triposrGeo);
        } catch (tErr) {
          console.error("[3D Viewer] TripoSR 3D Mesh generation failed:", tErr);
          const msg = tErr instanceof Error ? tErr.message : String(tErr);
          setErrorMsg(`TripoSR 3D Mesh Error: ${msg}`);
          setStatus("error");
          return;
        }
      }

      // Animation
      let spinAngle = 0;
      let rafId = 0;

      const animate = () => {
        rafId = requestAnimationFrame(animate);

        if (autoSpinRef.current && !isDragging.current) {
          spinAngle += 0.005;
          group.rotation.y += (Math.sin(spinAngle) * 0.45 - group.rotation.y) * 0.025;
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
        renderer, scene, camera, group, cardMesh, triposrMesh,
        cardMaterial: subjectMat, rafId, materials, geometries, textures, resizeObserver,
      };

      setViewMode(targetMode);
      setProgress({ label: "Done!", percent: 100 });
      setStatus("ready");

    } catch (err) {
      if (primaryBlobUrl) URL.revokeObjectURL(primaryBlobUrl);
      console.error("[3D Viewer] Pipeline failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
    }
  }, [imageUrl, depthScale]);

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
    targetRotation.current.x = Math.max(-0.85, Math.min(0.85, targetRotation.current.x + dy * 0.007));
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    targetZoom.current = Math.max(2.2, Math.min(9, targetZoom.current + e.deltaY * 0.005));
  }, []);

  const resetView = useCallback(() => {
    targetRotation.current = { x: 0, y: 0 };
    targetZoom.current = 4.5;
    setAutoSpin(true);
  }, []);

  return (
    <div className="space-y-3">

      {/* ── Idle ─────────────────────────────────────────────────────── */}
      {status === "idle" && (
        <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-app-accent/30 bg-app-accent/10 text-app-accent shadow-[0_0_24px_rgba(234,179,8,0.15)]">
            <Box className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">TripoSR AI 3D Mesh Generator</h4>
            <p className="mt-1 text-xs text-app-muted max-w-xs mx-auto leading-relaxed">
              Generates a full 3D neural mesh of the animal from a single photo using on-device TripoSR ONNX.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void generate("triposr")}
              className="flex items-center gap-2 rounded-xl border border-app-accent/40 bg-app-accent/15 px-6 py-2.5 text-sm font-semibold text-app-accent hover:bg-app-accent/25 active:scale-95 transition cursor-pointer shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              Generate TripoSR 3D Mesh
            </button>
            <button
              type="button"
              onClick={() => void generate("cutout")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-app-soft hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              3D Relief Cutout
            </button>
          </div>
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
            All AI processing runs 100% on-device via ONNX Runtime Web. Zero Python needed.
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
            onClick={() => void generate("triposr")}
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
                onClick={() => void switchMode("triposr")}
                title="Full TripoSR 3D Mesh reconstructed with neural implicit fields"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  viewMode === "triposr" ? "bg-app-accent text-black font-semibold" : "text-app-soft hover:text-white"
                }`}
              >
                <Box className="h-3 w-3" />
                <span>TripoSR 3D Mesh</span>
              </button>
              <button
                type="button"
                onClick={() => void switchMode("cutout")}
                title="Background-isolated cutout in 3D space"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  viewMode === "cutout" ? "bg-app-accent text-black font-semibold" : "text-app-soft hover:text-white"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Cutout{aiSegmented ? " ✦AI" : smartFallback ? " ✦Smart" : ""}</span>
              </button>
              <button
                type="button"
                onClick={() => void switchMode("card")}
                title="Full photo as 3D relief card"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  viewMode === "card" ? "bg-app-accent text-black font-semibold" : "text-app-soft hover:text-white"
                }`}
              >
                <ImageIcon className="h-3 w-3" />
                <span>Card</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Depth control for card/cutout */}
            {viewMode !== "triposr" && (
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
            )}
            {/* Re-generate */}
            <button
              type="button"
              onClick={() => void generate(viewMode)}
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
            { title: "Zoom in",  icon: <ZoomIn  className="h-3.5 w-3.5" />, action: () => { targetZoom.current = Math.max(2.2, targetZoom.current - 0.7); } },
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
          Drag to rotate · Scroll to zoom
        </div>
      </div>
    </div>
  );
}
