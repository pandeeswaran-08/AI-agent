import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface ThreeNeuralCoreProps {
  isGenerating?: boolean;
  activeModelName?: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

export const ThreeNeuralCore: React.FC<ThreeNeuralCoreProps> = ({
  isGenerating = false,
  activeModelName = 'Kilo Auto Free',
  onToggleExpand,
  isExpanded = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(isGenerating);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detector (Skill standard)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Scene, Fog, and Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090a0f, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.8);
    camera.lookAt(0, 0, 0);

    // 4. Studio Environment via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const ambient = new THREE.HemisphereLight(0x06b6d4, 0x1e1b4b, 0.9);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xa855f7, 2.2);
    keyLight.position.set(4, 5, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // 6. Procedural Composite 3D Neural Subject (Composite of 7 distinct parts)
    const neuralGroup = new THREE.Group();
    scene.add(neuralGroup);

    // Part 1: Core Singular Pulsing Sphere (Physical material with glow)
    const coreGeo = new THREE.SphereGeometry(0.75, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    neuralGroup.add(coreMesh);

    // Part 2: Inner Equatorial Gimbal Ring (Beveled Torus with High Brushed Metalness)
    const ring1Geo = new THREE.TorusGeometry(1.2, 0.035, 16, 64);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    neuralGroup.add(ring1);

    // Part 3: Middle Polar Orbital Ring
    const ring2Geo = new THREE.TorusGeometry(1.45, 0.025, 16, 64);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      metalness: 0.85,
      roughness: 0.3,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    neuralGroup.add(ring2);

    // Part 4: Outer Geodesic Lattice Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.7, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      metalness: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    neuralGroup.add(cageMesh);

    // Part 5: Vertical Magnetic Emitter Spindles
    const spindleGroup = new THREE.Group();
    const spindleGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.2, 16);
    const spindleMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const spindleTop = new THREE.Mesh(spindleGeo, spindleMat);
    spindleGroup.add(spindleTop);
    neuralGroup.add(spindleGroup);

    // Part 6: Orbiting Data Particle Cloud (InstancedMesh)
    const particleCount = 200;
    const particleGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);

    const dummy = new THREE.Object3D();
    const particlePositions: Array<{ radius: number; angle: number; speed: number; y: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 0.9;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
      const y = (Math.random() - 0.5) * 1.6;
      particlePositions.push({ radius, angle, speed, y });

      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.updateMatrix();
      particleMesh.setMatrixAt(i, dummy.matrix);
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.computeBoundingSphere();
    neuralGroup.add(particleMesh);

    // Part 7: Grounding Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
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
      opacity: 0.5,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.4;
    scene.add(shadowPlane);

    // 7. Animation Loop with Software-WebGL Guard
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
      const generating = isGeneratingRef.current;
      const baseSpeed = generating ? 2.4 : 0.8;

      // Rotate concentric layers smoothly
      neuralGroup.rotation.y += delta * 0.35 * baseSpeed;
      ring1.rotation.z += delta * 0.6 * baseSpeed;
      ring1.rotation.x += delta * 0.2 * baseSpeed;

      ring2.rotation.y -= delta * 0.8 * baseSpeed;
      ring2.rotation.z += delta * 0.3 * baseSpeed;

      cageMesh.rotation.y += delta * 0.2 * baseSpeed;
      cageMesh.rotation.x -= delta * 0.15 * baseSpeed;

      // Pulse core scale when active
      const pulse = 1 + Math.sin(elapsed * (generating ? 8 : 2.5)) * (generating ? 0.08 : 0.03);
      coreMesh.scale.set(pulse, pulse, pulse);

      // Emissive color transitions
      if (generating) {
        coreMat.emissive.setHex(0xa855f7);
        coreMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 10) * 0.4;
      } else {
        coreMat.emissive.setHex(0x0891b2);
        coreMat.emissiveIntensity = 0.6 + Math.sin(elapsed * 2) * 0.2;
      }

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        const p = particlePositions[i];
        p.angle += delta * p.speed * baseSpeed;
        dummy.position.set(
          Math.cos(p.angle) * p.radius,
          p.y + Math.sin(elapsed * 2 + i) * 0.05,
          Math.sin(p.angle) * p.radius
        );
        dummy.updateMatrix();
        particleMesh.setMatrixAt(i, dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      // Render
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Resize Handler
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      spindleGeo.dispose();
      spindleMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();
      shadowMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 rounded-2xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md ${
        isExpanded ? 'h-[440px]' : 'h-[170px]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec Overlay Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>NEURAL CORE // {isGenerating ? 'PROCESSING' : 'STANDBY'}</span>
        </div>
        <div className="hidden sm:flex items-center px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/20 text-[11px] font-mono text-purple-300">
          {activeModelName}
        </div>
      </div>

      {/* Top Right Expand / Minimize Button */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            title={isExpanded ? 'Minimize 3D Viewport' : 'Expand 3D Scene'}
          >
            {isExpanded ? 'Minimize' : 'Expand 3D'}
          </button>
        )}
      </div>

      {/* Sleek Collapsible Bottom Dock (Skill standard: consolidated controls pinned bottom-center) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 w-auto max-w-[92%] transition-transform duration-300">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-300 shadow-xl">
          <span className="text-cyan-400 font-semibold">JX-3D</span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">
            {isGenerating ? 'Active Neural Synthesis' : 'Orbital PBR Simulation'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] text-emerald-400">60 FPS</span>
        </div>
      </div>
    </div>
  );
};
