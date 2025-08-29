import * as BABYLON from 'babylonjs';
import 'babylonjs-gui';
import { AudioBus } from '../../systems/Audio';

export class CableRouting {
  isSolved = false;
  private scene: BABYLON.Scene;
  private onSolved: ()=>void;
  private mapping: {[k:string]: number};
  private audio: AudioBus;

  constructor(scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh, mapping: {[k:string]: number}, audio: AudioBus, onSolved: ()=>void){
    this.scene = scene; this.onSolved = onSolved; this.mapping = mapping; this.audio = audio;
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, ()=> this.open()));
  }

  private open(){
    if(this.isSolved) return;
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('CableUI', true, this.scene);

    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.6; panel.height=0.6; panel.background='rgba(26,26,29,0.98)'; panel.cornerRadius=12; panel.thickness=0;
    ui.addControl(panel);

    // Title
    const title = new BABYLON.GUI.TextBlock('', 'Connect cables to matching ports');
    title.color='#FFFFFF'; title.fontSize=22; title.top='8px';
    panel.addControl(title);

    const container = new BABYLON.GUI.Grid();
    container.width=0.9; container.height=0.75; container.top='40px';
    container.addColumnDefinition(0.5); container.addColumnDefinition(0.5);
    container.addRowDefinition(1);
    panel.addControl(container);

    // Left: cables
    const left = new BABYLON.GUI.StackPanel(); left.isVertical=true; left.spacing=10;
    const right = new BABYLON.GUI.StackPanel(); right.isVertical=true; right.spacing=10;
    container.addControl(left,0,0); container.addControl(right,0,1);

    // Ports 1-4
    const ports: {[n:number]: BABYLON.GUI.Rectangle} = {};
    for(let p=1;p<=4;p++){
      const r = new BABYLON.GUI.Rectangle(); r.height='60px'; r.thickness=2; r.color='#FF6A00'; r.background='rgba(14,14,16,0.8)'; r.cornerRadius=8;
      const t = new BABYLON.GUI.TextBlock('', `PORT ${p}`); t.color='#00FFF0'; t.fontSize=20;
      r.addControl(t); right.addControl(r); ports[p]=r;
    }

    // Draggable cables A-D
    const placed: {[k:string]: number} = {};
    const makeCable = (name:string, color:string)=>{
      const r = new BABYLON.GUI.Rectangle(); r.height='60px'; r.thickness=0; r.background=color; r.cornerRadius=8;
      const t = new BABYLON.GUI.TextBlock('', `CABLE ${name}`); t.color='#0E0E10'; t.fontSize=20; r.addControl(t);
      r.draggable = true; r.onPointerDragEndObservable.add((ev)=>{
        // drop detect: closest port
        let best: number | null = null; let bestDist = Infinity;
        Object.entries(ports).forEach(([n,port])=>{
          const dx = r.centerX - port.centerX; const dy = r.centerY - port.centerY;
          const d2 = dx*dx + dy*dy; if(d2<bestDist){ bestDist=d2; best=Number(n); }
        });
        if(best!==null){
          placed[name] = best!;
          this.audio.click();
          // snap visually next to port
          r.left = ports[best!]!.left; r.top = (ports[best!]!.top as any) + 0;
          // validate all four
          if(Object.keys(placed).length===4){
            const ok = Object.entries(this.mapping).every(([k,v])=> placed[k]===v);
            if(ok){
              this.isSolved = true; this.audio.ok();
              (this.scene as any).__toast = 'Cabling correct.';
              setTimeout(()=>{ ui.dispose(); this.onSolved(); }, 300);
            } else {
              this.audio.err(); (this.scene as any).__toast = 'Wrong mapping. Try again.';
            }
          }
        }
      });
      left.addControl(r);
    };
    makeCable('A','#FF6A00'); makeCable('B','#FF7F2A'); makeCable('C','#00FFF0'); makeCable('D','#00FF90');
  }

  showHint(level:1|2){
    (this.scene as any).__toast = level===1 ? 'Match labels by color/numbering' : 'A→2, B→4, C→1, D→3';
  }

  autoSolve(){ /* handled at UI time, ignored here */ }
}
