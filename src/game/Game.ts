import * as BABYLON from 'babylonjs';
import { defaultConfig, GameConfig } from '../config/gameConfig';
import { StateMachine, GameState } from '../systems/State';
import { InteractSystem } from '../systems/Interact';
import { HUD } from '../ui/HUD';
import { buildScene } from './SceneBuilder';
import { AudioBus } from '../systems/Audio';
import { PowerSequencer } from './Puzzles/PowerSequencer';
import { AccessKeypad } from './Puzzles/AccessKeypad';
import { CableRouting } from './Puzzles/CableRouting';
import { ThermalControl } from './Puzzles/ThermalControl';

export class Game {
  private engine: BABYLON.Engine;
  private cfg: GameConfig;
  private state = new StateMachine();
  private hud!: HUD;
  private interact!: InteractSystem;
  private audio = new AudioBus();
  private lastInput = performance.now();
  private solved = new Set<string>();
  private door?: BABYLON.AbstractMesh;
  private scene?: BABYLON.Scene;

  constructor(engine: BABYLON.Engine, cfg: GameConfig = defaultConfig){
    this.engine = engine; this.cfg = cfg;
  }

  async start(){
    const { scene, camera, door, powerAnchor, keypadPanel, cablePanel, thermalPanel, neonTargets } = await buildScene(this.engine, this.cfg);
    this.scene = scene; this.door = door;

    this.hud = new HUD(scene, this.cfg.theme.colors.orange, this.cfg.theme.colors.accentCyan);
    this.interact = new InteractSystem(scene, camera);
    this.hud.onHintClick(()=> this.showContextHint());

    // Input setup
    const onInput = ()=>{ if(this.state.state==='MENU'){ this.state.set('PLAY'); this.hud.startTimer(); } this.lastInput = performance.now(); };
    scene.onKeyboardObservable.add(onInput as any);
    scene.onPointerObservable.add(onInput as any);

    window.addEventListener('keydown', (ev)=>{
      if(ev.key==='e' || ev.key==='E'){ this.interact.tryInteract() && ev.preventDefault(); }
      if(ev.key==='h' || ev.key==='H'){ this.hud.toggleHints(); }
      if(ev.key==='p' || ev.key==='P' || ev.key==='Escape'){
        if(this.state.state==='PLAY'){ this.pause(true); }
        else if(this.state.state==='PAUSED'){ this.pause(false); }
      }
      if(ev.key==='r' || ev.key==='R'){ this.restart(); }
    });

    // Puzzles
    const neonApply = ()=> neonTargets.forEach(m=>{
      const mat = (m.material as BABYLON.StandardMaterial) || new BABYLON.StandardMaterial('nm', scene);
      mat.emissiveColor = BABYLON.Color3.FromHexString('#FF6A00').scale(0.8);
      m.material = mat;
    });

    const power = new PowerSequencer(scene, new BABYLON.Vector3(powerAnchor.x-0.7,0,powerAnchor.z), this.cfg, this.audio, ()=>this.markSolved('power'), neonApply);
    const keypad = new AccessKeypad(scene, keypadPanel, this.cfg.keypadCode, this.audio, ()=>this.markSolved('keypad'));
    const cabling = new CableRouting(scene, cablePanel, this.cfg.cableMap, this.audio, ()=>this.markSolved('cabling'));
    const thermal = new ThermalControl(scene, thermalPanel, this.cfg.thermalTarget, this.audio, ()=>this.markSolved('thermal'));

    // Register interactables with labels
    this.interact.register(keypadPanel, 'Access Keypad', ()=>keypad['open']?.());
    this.interact.register(cablePanel, 'Cable Routing', ()=>cabling['open']?.());
    this.interact.register(thermalPanel, 'Thermal Control', ()=>thermal['open']?.());

    // Debug auto-solve
    const url = new URL(window.location.href);
    if(url.searchParams.get('debug')==='1'){
      setTimeout(()=>{ power.autoSolve(); this.markSolved('power'); this.markSolved('keypad'); this.markSolved('cabling'); this.markSolved('thermal'); }, 500);
    }

    // Render/update loop
    this.engine.runRenderLoop(()=>{
      this.interact.update();
      // HUD updates
      if(this.interact.current) this.hud.setInteractLabel(this.interact.current.label);
      else this.hud.setInteractLabel();
      this.hud.update();

      // idle hint after 60s
      if(performance.now() - this.lastInput > 60000) this.showContextHint(true);

      scene.render();
    });
    window.addEventListener('resize', ()=>this.engine.resize());
  }

  private showContextHint(forceSecond=false){
    if(!this.scene) return;
    const looking = this.interact.current?.label;
    const second = forceSecond;
    if(looking?.includes('Power') || looking?.includes('Sequencer')){
      this.hud.showHint(second ? 'Exact order on the BOOT ORDER poster.' : 'Check the wall poster for boot order.');
    } else if(looking?.includes('Keypad')){
      this.hud.showHint(second ? 'The code is the sequence of highlighted labels.' : 'Look for numbers on posters and rack labels.');
    } else if(looking?.includes('Cable')){
      this.hud.showHint(second ? 'A→2, B→4, C→1, D→3.' : 'Match cable letters to port numbers by color.');
    } else if(looking?.includes('Thermal')){
      this.hud.showHint(second ? 'Aim for 22–24 °C using all sliders.' : 'Small adjustments matter; watch the temp readout.');
    } else {
      this.hud.showHint('Explore the panels. Press E to interact.');
    }
  }

  private pause(v:boolean){
    if(v){
      this.state.set('PAUSED'); this.hud.showPause(true); this.hud.pauseTimer(); this.engine.stopRenderLoop();
    } else {
      this.state.set('PLAY'); this.hud.showPause(false); this.hud.resumeTimer();
      this.engine.runRenderLoop(()=>{ this.interact.update(); this.hud.update(); this.scene?.render(); });
    }
  }

  private markSolved(id:string){
    this.solved.add(id);
    if(this.solved.size===4) this.openDoor();
  }

  private openDoor(){
    if(!this.scene || !this.door) return;
    const anim = new BABYLON.Animation('doorOpen','position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const y0 = this.door.position.y;
    anim.setKeys([{frame:0,value:y0},{frame:60,value:y0+2.6}]);
    this.door.animations = [anim];
    this.scene.beginAnimation(this.door,0,60,false,1.0, ()=>{
      this.state.set('WON');
      const elapsed = (this.hud.getElapsedMS()/1000)|0;
      const mm = String((elapsed/60)|0).padStart(2,'0');
      const ss = String(elapsed%60).padStart(2,'0');
      this.hud.showWin('SYSTEM RESTORED', `Time to escape: ${mm}:${ss}`, ()=>this.restart());
    });
  }

  private restart(){ window.location.reload(); }
}
