import * as ort from "onnxruntime-web";
import { generateMeshFromGrid, MeshData } from "./marchingCubes";
export type { MeshData };

// HuggingFace CDN URLs for TripoSR ONNX model weights
const ENCODER_MODEL_URL =
  "https://huggingface.co/fernandotonon/QtMeshEditor-triposr-onnx/resolve/main/triposr_encoder_int8.onnx";
const DECODER_MODEL_URL =
  "https://huggingface.co/fernandotonon/QtMeshEditor-triposr-onnx/resolve/main/triposr_decoder.onnx";

const CACHE_NAME = "biblos-triposr-models-v1";

export interface TripoSRProgress {
  label: string;
  percent: number;
}

let encoderSession: ort.InferenceSession | null = null;
let decoderSession: ort.InferenceSession | null = null;

/**
 * Downloads model weight file with local Cache API persistent storage and safe progress updates.
 */
async function fetchModelWithCache(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResp = await cache.match(url);
      if (cachedResp) {
        console.log(`[TripoSR] Loaded cached model: ${url}`);
        onProgress?.(100, 100);
        return await cachedResp.arrayBuffer();
      }
    } catch (e) {
      console.warn("[TripoSR] Cache API lookup failed:", e);
    }
  }

  const response = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to download TripoSR model (${response.status} ${response.statusText})`);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    const buf = await response.arrayBuffer();
    onProgress?.(100, 100);
    return buf;
  }

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.(loaded, total > 0 ? total : 0);
    }
  }

  const combined = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const respToCache = new Response(combined.buffer, {
        headers: { "Content-Type": "application/octet-stream" },
      });
      await cache.put(url, respToCache);
      console.log(`[TripoSR] Cached model weights to Cache API: ${url}`);
    } catch (e) {
      console.warn("[TripoSR] Failed to cache model weights:", e);
    }
  }

  return combined.buffer;
}

/**
 * Initializes the ONNX Runtime sessions for Encoder & Decoder with WASM single-threaded backend.
 * numThreads=1 avoids the need for threaded .mjs worker files which Vite cannot import from /public.
 */
export async function initTripoSRSessions(
  onProgress?: (progress: TripoSRProgress) => void
): Promise<{ encoder: ort.InferenceSession; decoder: ort.InferenceSession }> {
  if (encoderSession && decoderSession) {
    return { encoder: encoderSession, decoder: decoderSession };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assetsUrl = origin ? `${origin}/assets/` : "/assets/";

  // Force single-threaded WASM execution and explicitly map all WASM / JS glue binaries
  // to avoid colliding with other libraries or missing .mjs workers.
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = assetsUrl;

  onProgress?.({ label: "Downloading TripoSR Encoder (~430MB INT8 model)…", percent: 5 });

  const encoderBuffer = await fetchModelWithCache(ENCODER_MODEL_URL, (loaded, total) => {
    const pct = total > 0 ? Math.min(45, Math.round((loaded / total) * 45)) : Math.min(45, Math.round((loaded / (430 * 1024 * 1024)) * 45));
    onProgress?.({ label: `Downloading TripoSR Encoder… (${(loaded / 1024 / 1024).toFixed(1)}MB)`, percent: 5 + pct });
  });

  onProgress?.({ label: "Downloading TripoSR Decoder (~15MB model)…", percent: 52 });

  const decoderBuffer = await fetchModelWithCache(DECODER_MODEL_URL, (loaded, total) => {
    const pct = total > 0 ? Math.min(15, Math.round((loaded / total) * 15)) : Math.min(15, Math.round((loaded / (15 * 1024 * 1024)) * 15));
    onProgress?.({ label: `Downloading TripoSR Decoder… (${(loaded / 1024 / 1024).toFixed(1)}MB)`, percent: 52 + pct });
  });

  onProgress?.({ label: "Initializing WebAssembly AI Engine…", percent: 70 });

  // Re-assert single-threading immediately before session initialization
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;

  const options: ort.InferenceSession.SessionOptions = {
    executionProviders: ["wasm"],
  };

  const encoderData = new Uint8Array(encoderBuffer);
  const decoderData = new Uint8Array(decoderBuffer);

  try {
    encoderSession = await ort.InferenceSession.create(encoderData, options);
  } catch (err) {
    console.warn("[TripoSR] Encoder session creation retry:", err);
    encoderSession = await ort.InferenceSession.create(encoderData);
  }

  try {
    decoderSession = await ort.InferenceSession.create(decoderData, options);
  } catch (err) {
    console.warn("[TripoSR] Decoder session creation retry:", err);
    decoderSession = await ort.InferenceSession.create(decoderData);
  }

  console.log("[TripoSR] Sessions ready. Encoder inputs:", encoderSession.inputNames, "outputs:", encoderSession.outputNames);
  console.log("[TripoSR] Decoder inputs:", decoderSession.inputNames, "outputs:", decoderSession.outputNames);

  onProgress?.({ label: "TripoSR AI Engine Ready", percent: 75 });
  return { encoder: encoderSession, decoder: decoderSession };
}

/**
 * Preprocesses input image canvas into a 512x512 Float32Array tensor [1, 3, 512, 512].
 */
function preprocessImage(srcCanvas: HTMLCanvasElement): Float32Array {
  const SIZE = 512;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const scale = Math.min(SIZE / srcCanvas.width, SIZE / srcCanvas.height);
  const w = srcCanvas.width * scale;
  const h = srcCanvas.height * scale;
  const x = (SIZE - w) / 2;
  const y = (SIZE - h) / 2;
  ctx.drawImage(srcCanvas, x, y, w, h);

  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const px = imgData.data;

  const tensorData = new Float32Array(3 * SIZE * SIZE);

  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = px[i * 4] / 255.0;
    const g = px[i * 4 + 1] / 255.0;
    const b = px[i * 4 + 2] / 255.0;

    tensorData[i] = r;
    tensorData[SIZE * SIZE + i] = g;
    tensorData[SIZE * SIZE * 2 + i] = b;
  }

  return tensorData;
}

/**
 * Generates a full 3D mesh model from an image using TripoSR.
 */
export async function generateTripoSRMesh(
  inputCanvas: HTMLCanvasElement,
  onProgress?: (progress: TripoSRProgress) => void,
  gridDim = 64
): Promise<MeshData> {
  const { encoder, decoder } = await initTripoSRSessions(onProgress);

  onProgress?.({ label: "Preprocessing image for TripoSR…", percent: 78 });
  const imageTensorData = preprocessImage(inputCanvas);
  const imageTensor = new ort.Tensor("float32", imageTensorData, [1, 3, 512, 512]);

  onProgress?.({ label: "Extracting 3D Triplane Features…", percent: 82 });

  const encoderInputName = encoder.inputNames[0] || "image";
  const encoderResults = await encoder.run({ [encoderInputName]: imageTensor });
  const triplaneTensor = encoderResults[encoder.outputNames[0]];

  onProgress?.({ label: "Sampling 3D NeRF Grid…", percent: 87 });

  const numPoints = gridDim * gridDim * gridDim;
  const gridCoords = new Float32Array(numPoints * 3);

  const step = 2.0 / (gridDim - 1);
  let pIdx = 0;
  for (let z = 0; z < gridDim; z++) {
    const pz = -1.0 + z * step;
    for (let y = 0; y < gridDim; y++) {
      const py = -1.0 + y * step;
      for (let x = 0; x < gridDim; x++) {
        const px = -1.0 + x * step;
        gridCoords[pIdx * 3 + 0] = px;
        gridCoords[pIdx * 3 + 1] = py;
        gridCoords[pIdx * 3 + 2] = pz;
        pIdx++;
      }
    }
  }

  const BATCH_SIZE = 16384;
  const densities = new Float32Array(numPoints);
  const colors = new Float32Array(numPoints * 3);

  const decoderInput1 = decoder.inputNames[0] || "scene_codes";
  const decoderInput2 = decoder.inputNames[1] || "positions";

  for (let offset = 0; offset < numPoints; offset += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, numPoints - offset);
    const batchCoordsData = gridCoords.subarray(offset * 3, (offset + currentBatchSize) * 3);
    const coordsTensor = new ort.Tensor("float32", batchCoordsData, [1, currentBatchSize, 3]);

    const decoderFeats = await decoder.run({
      [decoderInput1]: triplaneTensor,
      [decoderInput2]: coordsTensor,
    });

    const outDensityKey = decoder.outputNames.find((n) => n.includes("density") || n.includes("sigma")) || decoder.outputNames[0];
    const outColorKey = decoder.outputNames.find((n) => n.includes("rgb") || n.includes("color") || n.includes("features")) || decoder.outputNames[1] || decoder.outputNames[0];

    const densityOut = decoderFeats[outDensityKey].data as Float32Array;
    const colorOut = decoderFeats[outColorKey]?.data as Float32Array;

    for (let i = 0; i < currentBatchSize; i++) {
      densities[offset + i] = densityOut[i];

      if (colorOut && colorOut.length >= currentBatchSize * 3) {
        colors[(offset + i) * 3 + 0] = Math.max(0, Math.min(1, colorOut[i * 3 + 0]));
        colors[(offset + i) * 3 + 1] = Math.max(0, Math.min(1, colorOut[i * 3 + 1]));
        colors[(offset + i) * 3 + 2] = Math.max(0, Math.min(1, colorOut[i * 3 + 2]));
      } else {
        colors[(offset + i) * 3 + 0] = 0.80;
        colors[(offset + i) * 3 + 1] = 0.75;
        colors[(offset + i) * 3 + 2] = 0.65;
      }
    }

    const pct = Math.round((offset / numPoints) * 8);
    onProgress?.({ label: `Evaluating 3D NeRF Density (${Math.round((offset / numPoints) * 100)}%)…`, percent: 87 + pct });
  }

  let minD = Infinity, maxD = -Infinity, sumD = 0;
  for (let i = 0; i < numPoints; i++) {
    const v = densities[i];
    if (v < minD) minD = v;
    if (v > maxD) maxD = v;
    sumD += v;
  }
  const avgD = sumD / numPoints;
  console.log(`[TripoSR] Density statistics -> Min: ${minD.toFixed(4)}, Max: ${maxD.toFixed(4)}, Avg: ${avgD.toFixed(4)}`);

  if (maxD <= minD + 1e-4) {
    throw new Error("TripoSR model returned uniform density across the 3D grid.");
  }

  onProgress?.({ label: "Extracting 3D Mesh Isosurface (Marching Cubes)…", percent: 96 });

  let bestMesh: MeshData | null = null;
  const thresholdFactors = [0.35, 0.25, 0.18, 0.12, 0.05, 0.01];

  for (const factor of thresholdFactors) {
    const isovalue = minD + (maxD - minD) * factor;
    const mesh = generateMeshFromGrid(gridDim, densities, colors, isovalue, [-1.0, 1.0]);
    if (mesh.positions.length > 30) {
      console.log(`[TripoSR] Generated 3D Mesh at isovalue ${isovalue.toFixed(4)} (${mesh.positions.length / 9} triangles)`);
      bestMesh = mesh;
      break;
    }
  }

  if (!bestMesh || bestMesh.positions.length === 0) {
    throw new Error("Failed to extract surface triangles from NeRF density field.");
  }

  onProgress?.({ label: "TripoSR 3D Model Ready!", percent: 100 });
  return bestMesh;
}
