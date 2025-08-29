import * as BABYLON from 'babylonjs';
import { AudioBus } from '../../systems/Audio';
import { GameConfig } from '../../config/gameConfig';

export class PowerSequencer {
  isSolved = false;
  private scene: BABYLON.Scene;
  private root: BABYLON.TransformNode;
  private levers: BABYLON.Mesh[] = [];
  private pressedOrder: number[] = [];
  private onSolved: ()=>void;
  private audio: AudioBus;
  private cfg: GameConfig;
  private eggHistory: Array<{i:number, t:number}> = [];
  private neonApply?: ()=>void;

  constructor(scene: BABYLON.Scene, anchor: BABYLON.Vector3, cfg: GameConfig, audio: AudioBus, onSolved: ()=>void, neonApply: ()=>void){
    this.scene = scene; this.onSolved = onSolved; this.audio = audio; this.cfg = cfg; this.neonApply = neonApply;
    this.root = new BABYLON.TransformNode('PowerSequencerRoot', scene);
    this.root.position = anchor.clone();

    // Panel box
    const panel = BABYLON.MeshBuilder.CreateBox('powerPanel',{width:1.2,height:1.2,depth:0.1},scene);
    panel.position = new BABYLON.Vector3(0,1.2,0); panel.parent = this.root;
    const mat = new BABYLON.StandardMaterial('powerMat', scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString('#1A1A1D');
    mat.emissiveColor = BABYLON.Color3.FromHexString('#FF6A00').scale(0.1);
    panel.material = mat;

    // 4 levers
    for(let i=0;i<4;i++){
      const lever = BABYLON.MeshBuilder.CreateBox(`lever${i+1}`, {width:0.15,height:0.6,depth:0.15}, scene);
      lever.parent = this.root; lever.position = new BABYLON.Vector3(-0.45 + i*0.3, 1.2, 0.08);
      lever.rotation = new BABYLON.Vector3(0,0,0);
      lever.metadata = { interact: true };
      const lmat = new BABYLON.StandardMaterial(`lmat${i}`, scene);
      lmat.diffuseColor = new BABYLON.Color3(0.1,0.1,0.1);
      lmat.emissiveColor = BABYLON.Color3.FromHexString('#00FFF0').scale(0.4);
      lever.material = lmat;
      this.levers.push(lever);
    }

    // Hint poster (dynamic texture) with subtle “boot path” arrow numbers
    const plane = BABYLON.MeshBuilder.CreatePlane('poster',{size:1.1},scene);
    plane.position = new BABYLON.Vector3(0, 2.4, 0.02); plane.parent = this.root;
    const dt = new BABYLON.DynamicTexture('posterDT',{width:512,height:512},scene,true);
    const ctx = dt.getContext();
    ctx.fillStyle = '#0E0E10'; ctx.fillRect(0,0,512,512);
    ctx.fillStyle = '#FF6A00'; ctx.font = 'bold 48px monospace';
    ctx.fillText('BOOT ORDER', 90, 80);
    ctx.fillStyle = '#00FF90'; ctx.font = '36px monospace';
    ctx.fillText(`${cfg.powerSequence.join(' → ')}`, 200, 300);
    dt.update();
    const pmat = new BABYLON.StandardMaterial('posterMat', scene);
    pmat.diffuseTexture = dt; pmat.emissiveColor = new BABYLON.Color3(0.1,0.1,0.1); plane.material = pmat;

    // Interactions
    this.levers.forEach((lever, idx)=>{
      lever.actionManager = new BABYLON.ActionManager(scene);
      lever.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, ()=>{
        this.flip(idx+1, lever);
      }));
    });
  }

  private flip(i: number, lever: BABYLON.Mesh){
    if(this.isSolved) return;
    // animate quick tilt
    const anim = new BABYLON.Animation('tilt','rotation.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [{frame:0, value:0}, {frame:6, value:-0.5}, {frame:12, value:0}];
    anim.setKeys(keys); lever.animations = [anim]; this.scene.beginAnimation(lever,0,12,false);
    this.audio.click();

    // record orders
    this.pressedOrder.push(i);

    // Easter egg tracking
    const now = performance.now();
    this.eggHistory.push({i, t: now});
    // keep only last 4 within window
    const windowMS = this.cfg.easterEgg.windowSeconds*1000;
    this.eggHistory = this.eggHistory.filter(e => now-e.t <= windowMS);
    if(this.eggHistory.length >= 4){
      const last4 = this.eggHistory.slice(-4).map(e=>e.i);
      if(JSON.stringify(last4) === JSON.stringify(this.cfg.easterEgg.sequence)){
        this.neonApply && this.neonApply();
        this.toast('MARGINHUNTER unlocked — Cost Saved!');
      }
    }

    const seq = this.cfg.powerSequence;
    const k = this.pressedOrder.length;
    if(this.pressedOrder[k-1] !== seq[k-1]){
      // wrong – reset
      this.pressedOrder = [];
      this.audio.err();
      this.toast('Wrong breaker order. Try again.');
      return;
    }
    if(k === seq.length){
      this.isSolved = true;
      this.audio.ok();
      this.toast('Power restored.');
      this.onSolved();
    }
  }

  showHint(level:1|2){
    if(level===1) this.toast('Follow the BOOT ORDER poster.');
    else this.toast(`Exact order: ${this.cfg.powerSequence.join(' → ')}`);
  }

  autoSolve(){
    this.cfg.powerSequence.forEach((i, idx)=>{
      setTimeout(()=>this.flip(i, this.levers[i-1]), 120*idx);
    });
  }

  private toast(msg:string){
    // stash on scene metadata for HUD to pick up if desired
    (this.scene as any).__toast = msg;
  }
}
