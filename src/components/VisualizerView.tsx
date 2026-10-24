import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Boxes,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VisualizerViewProps {
  lang: 'en' | 'ta';
}

export const VisualizerView: React.FC<VisualizerViewProps> = ({ lang }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [activePreset, setActivePreset] = useState<'cyan' | 'purple' | 'emerald'>('cyan');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [particleMultiplier, setParticleMultiplier] = useState(1);

  // References to dynamic materials for live dock controls
  const coreMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const ring1MatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ring2MatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL detection per threejs skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // WebGLRenderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a0f);
    scene.fog = new THREE.FogExp2(0x090a0f, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.5);
    camera.lookAt(0, 0, 0);

    // Studio Environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced 3-point studio lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xa855f7, 2.8);
    keyLight.position.set(5, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    fillLight.position.set(-5, -2, -4);
    scene.add(fillLight);

    // Composite 3D procedural subject: JX Quantum Neural AI Rig
    const neuralRig = new THREE.Group();
    scene.add(neuralRig);

    // 1. Central Core Mesh
    const coreGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    coreMatRef.current = coreMat;
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    neuralRig.add(coreMesh);

    // 2. Gimbal Equatorial Ring
    const ring1Geo = new THREE.TorusGeometry(1.6, 0.045, 16, 80);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.15,
    });
    ring1MatRef.current = ring1Mat;
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    neuralRig.add(ring1);

    // 3. Middle Tilted Polar Ring
    const ring2Geo = new THREE.TorusGeometry(1.95, 0.035, 16, 80);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      metalness: 0.85,
      roughness: 0.25,
    });
    ring2MatRef.current = ring2Mat;
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    neuralRig.add(ring2);

    // 4. Outer Icosahedron Lattice Frame
    const cageGeo = new THREE.IcosahedronGeometry(2.35, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      metalness: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.5,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    neuralRig.add(cageMesh);

    // 5. Vertical Axis Shaft and Emitter Caps
    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.2, 24);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.18,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    neuralRig.add(shaft);

    // 6. Particle Cloud using InstancedMesh
    const particleCount = 350;
    const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);

    const dummy = new THREE.Object3D();
    const particlePositions: Array<{ radius: number; angle: number; speed: number; y: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 1.4;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);
      const y = (Math.random() - 0.5) * 2.2;
      particlePositions.push({ radius, angle, speed, y });

      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.updateMatrix();
      particleMesh.setMatrixAt(i, dummy.matrix);
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.computeBoundingSphere();
    neuralRig.add(particleMesh);

    // 7. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.0;
    scene.add(shadowPlane);

    // Interactive mouse drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      neuralRig.rotation.y += deltaX * 0.006;
      neuralRig.rotation.x += deltaY * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth idle rotation
      if (!isDragging) {
        neuralRig.rotation.y += delta * 0.45;
      }

      ring1.rotation.z += delta * 0.7;
      ring1.rotation.x += delta * 0.25;

      ring2.rotation.y -= delta * 0.9;
      ring2.rotation.z += delta * 0.35;

      cageMesh.rotation.y += delta * 0.2;
      cageMesh.rotation.x -= delta * 0.15;

      // Core harmonic scale pulse
      const pulse = 1.0 + Math.sin(elapsed * 2.8) * 0.04;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Orbit particles
      for (let i = 0; i < particleCount; i++) {
        const p = particlePositions[i];
        p.angle += delta * p.speed * 0.9;
        dummy.position.set(
          Math.cos(p.angle) * p.radius,
          p.y + Math.sin(elapsed * 2 + i) * 0.06,
          Math.sin(p.angle) * p.radius
        );
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const changePalette = (palette: 'cyan' | 'purple' | 'emerald') => {
    setActivePreset(palette);
    if (!coreMatRef.current) return;
    if (palette === 'cyan') {
      coreMatRef.current.color.setHex(0x06b6d4);
      coreMatRef.current.emissive.setHex(0x0891b2);
    } else if (palette === 'purple') {
      coreMatRef.current.color.setHex(0xa855f7);
      coreMatRef.current.emissive.setHex(0x7e22ce);
    } else {
      coreMatRef.current.color.setHex(0x10b981);
      coreMatRef.current.emissive.setHex(0x059669);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Spec Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <Boxes className="w-4 h-4 text-cyan-400" />
          <span>JX QUANTUM 3D SIMULATOR // PBR STUDIO</span>
        </div>
        <div className="hidden sm:flex px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
          Drag mouse to inspect 360°
        </div>
      </div>

      {/* Viewport-first Collapsible Bottom Control Dock (Strict Threejs Skill Directive) */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[94vw] transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Tab */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer shadow-lg"
          >
            {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isDockCollapsed ? 'Show Dock' : 'Collapse HUD'}</span>
          </button>
        </div>

        {/* Dock Controls Content */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 border border-slate-700 text-xs font-mono text-slate-200 shadow-2xl">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Energy Field:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => changePalette('cyan')}
                className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                  activePreset === 'cyan' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Cyan
              </button>
              <button
                onClick={() => changePalette('purple')}
                className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                  activePreset === 'purple' ? 'bg-purple-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Purple
              </button>
              <button
                onClick={() => changePalette('emerald')}
                className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer ${
                  activePreset === 'emerald' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Emerald
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">PBR Materials:</span>
            <span className="text-emerald-400 font-semibold">ACES Filmic</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">InstancedMesh Nodes:</span>
            <span className="text-cyan-300 font-bold">350</span>
          </div>
        </div>
      </div>
    </div>
  );
};
