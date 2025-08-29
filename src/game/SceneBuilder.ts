import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { GameConfig } from '../config/gameConfig';

export type SceneRefs = {
  door: BABYLON.AbstractMesh;
  powerAnchor: BABYLON.Vector3;
  keypadPanel: BABYLON.AbstractMesh;
  cablePanel: BABYLON.AbstractMesh;
  thermalPanel: BABYLON.AbstractMesh;
  neonTargets: BABYLON.AbstractMesh[];
};

async function tryLoad(path: string, scene: BABYLON.Scene, position: BABYLON.Vector3, rotation?: BABYLON.Vector3, scaling?: BABYLON.Vector3){
  try {
    const res = await BABYLON.SceneLoader.ImportMeshAsync('', '/models/', path, scene);
    const root = new BABYLON.TransformNode(`root_${path}`, scene);
    res.meshes.forEach(m=>{ if(m instanceof BABYLON.Mesh) m.parent = root; });
    root.position = position.clone();
    if(rotation) root.rotation = rotation.clone();
    if(scaling) root.scaling = scaling.clone();
    return root as any as BABYLON.AbstractMesh;
  } catch { return undefined; }
}

export async function buildScene(engine: BABYLON.Engine, cfg: GameConfig){
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.FromHexString(cfg.theme.colors.bg));

  const camera = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(0,1.7,-4), scene);
  camera.attachControl(true);
  camera.speed = 0.15; camera.angularSensibility = 2500;
  scene.onPointerDown = ()=>{ if(document.pointerLockElement !== engine.getRenderingCanvas()){ engine.getRenderingCanvas()?.requestPointerLock(); } };

  const light = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0,1,0), scene);
  light.intensity = 0.9;

  // Mild glow on emissives
  new BABYLON.GlowLayer('glow', scene, { blurKernelSize: 16, intensity: 0.3 });

  // Room (8x3x8)
  const room = new BABYLON.Mesh.CreateBox('room', 1, scene);
  room.isVisible = false;
  const matWall = new BABYLON.StandardMaterial('wall', scene);
  matWall.diffuseColor = BABYLON.Color3.FromHexString('#1A1A1D');
  const walls: BABYLON.Mesh[] = [];
  const makeWall = (name:string, w:number,h:number, d:number, pos:BABYLON.Vector3, rot?:BABYLON.Vector3)=>{
    const m = BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
    m.position = pos; if(rot) m.rotation=rot; m.material=matWall; walls.push(m); return m;
  };
  const size=8, height=3;
  makeWall('floor', size, 0.1, size, new BABYLON.Vector3(0,0,0));
  makeWall('ceil', size, 0.1, size, new BABYLON.Vector3(0,height,0));
  makeWall('back', size, height, 0.1, new BABYLON.Vector3(0,height/2, size/2));
  makeWall('front', size, height, 0.1, new BABYLON.Vector3(0,height/2,-size/2));
  makeWall('left', 0.1, height, size, new BABYLON.Vector3(-size/2,height/2,0));
  makeWall('right', 0.1, height, size, new BABYLON.Vector3(size/2,height/2,0));

  // Door (front wall center)
  let door = BABYLON.MeshBuilder.CreateBox('door',{width:1.6, height:2.4, depth:0.08},scene);
  door.position = new BABYLON.Vector3(0,1.2,-size/2+0.04);
  const doorMat = new BABYLON.StandardMaterial('doorMat', scene);
  doorMat.diffuseColor = BABYLON.Color3.FromHexString('#0E0E10');
  doorMat.emissiveColor = BABYLON.Color3.FromHexString('#FF6A00').scale(0.25);
  door.material = doorMat;

  // Try slotting optional glb
  const doorGLB = cfg.assets.door ? await tryLoad(cfg.assets.door, scene, door.position, undefined, new BABYLON.Vector3(1,1,1)) : undefined;
  if(doorGLB){ door.setEnabled(false); door = doorGLB; }

  // Panels (placeholders)
  const mkPanel = (name:string, pos:BABYLON.Vector3)=>{
    const p = BABYLON.MeshBuilder.CreateBox(name,{width:1.2,height:1.0,depth:0.08},scene);
    p.position = pos;
    const m = new BABYLON.StandardMaterial(`${name}Mat`,scene);
    m.diffuseColor = BABYLON.Color3.FromHexString('#1A1A1D');
    m.emissiveColor = BABYLON.Color3.FromHexString('#00FFF0').scale(0.15);
    p.material = m; p.metadata={interact:true}; return p;
  };
  const keypadPanel = mkPanel('keypadPanel', new BABYLON.Vector3(-2.5,1.2, -size/2+0.04));
  const cablePanel  = mkPanel('cablePanel',  new BABYLON.Vector3( 2.5,1.2, -size/2+0.04));
  const thermalPanel= mkPanel('thermalPanel',new BABYLON.Vector3( 0.0,0.9,  size/2-0.04));

  // Power sequencer anchor (right wall)
  const powerAnchor = new BABYLON.Vector3(size/2-0.1, 0, 0);

  // Decorative racks (placeholders)
  const makeRack = (x:number,z:number)=>{
    const r = BABYLON.MeshBuilder.CreateBox('rack',{width:0.8, height:2.0, depth:0.8}, scene);
    r.position = new BABYLON.Vector3(x,1.0,z);
    const m = new BABYLON.StandardMaterial('rackM', scene);
    m.diffuseColor = BABYLON.Color3.FromHexString('#0E0E10');
    m.emissiveColor = BABYLON.Color3.FromHexString('#00FF90').scale(0.1);
    r.material = m; return r;
  };
  const r1 = makeRack(-1.5,1.5), r2 = makeRack(0,1.5), r3 = makeRack(1.5,1.5);

  // Optional rack glb
  const rackGLB = cfg.assets.rack ? await tryLoad(cfg.assets.rack, scene, r1.position) : undefined;
  if(rackGLB){ r1.setEnabled(false); }

  // Labels/posters (keypad hint)
  const poster = BABYLON.MeshBuilder.CreatePlane('poster', {width:1.2, height:0.6}, scene);
  poster.position = new BABYLON.Vector3(-2.5, 2.1, -size/2+0.01);
  const dt = new BABYLON.DynamicTexture('hintDT',{width:512,height:256},scene,true);
  const ctx = dt.getContext();
  ctx.fillStyle = '#0E0E10'; ctx.fillRect(0,0,512,256);
  ctx.fillStyle = '#FF6A00'; ctx.font = 'bold 42px monospace'; ctx.fillText('RACK LABELS', 130, 60);
  ctx.fillStyle = '#00FFF0'; ctx.font = '32px monospace'; ctx.fillText('Aisle 4  •  Bay 2  •  Row 6  •  Unit 9', 30, 150);
  dt.update();
  const pm = new BABYLON.StandardMaterial('posterMat', scene); pm.diffuseTexture = dt; poster.material = pm;

  const neonTargets = [door, keypadPanel, cablePanel, thermalPanel, r1, r2, r3];

  return { scene, camera, door, powerAnchor, keypadPanel, cablePanel, thermalPanel, neonTargets } as unknown as (SceneRefs & { scene: BABYLON.Scene; camera: BABYLON.Camera });
}
