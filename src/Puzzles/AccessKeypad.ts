import * as BABYLON from 'babylonjs';
import 'babylonjs-gui';
import { AudioBus } from '../../systems/Audio';

export class AccessKeypad {
  isSolved = false;
  private scene: BABYLON.Scene;
  private code: string;
  private onSolved: ()=>void;
  private audio: AudioBus;
  private ui?: BABYLON.GUI.Rectangle;
  private buffer = '';

  constructor(scene: BABYLON.Scene, panelMesh: BABYLON.AbstractMesh, code: string, audio: AudioBus, onSolved: ()=>void){
    this.scene = scene; this.code = code; this.onSolved = onSolved; this.audio = audio;

    panelMesh.actionManager = new BABYLON.ActionManager(scene);
    panelMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, ()=>{
      this.open();
    }));
  }

  private open(){
    if(this.isSolved) return;
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('KeyUI', true, this.scene);
    const panel = new BABYLON.GUI.Rectangle();
    panel.width = 0.36; panel.height = 0.6; panel.background = 'rgba(26,26,29,0.98)'; panel.cornerRadius = 12; panel.thickness = 0;
    ui.addControl(panel);

    const display = new BABYLON.GUI.TextBlock('', '----');
    display.height = '60px'; display.color = '#00FFF0'; display.fontSize = 28; display.top = '12px';
    panel.addControl(display);

    const grid = new BABYLON.GUI.Grid();
    grid.top = '80px'; grid.width = 0.9; grid.height = 0.7;
    for(let i=0;i<4;i++) grid.addRowDefinition(0.25);
    for(let i=0;i<3;i++) grid.addColumnDefinition(0.333);
    panel.addControl(grid);

    const addBtn = (r:number,c:number,label:string, cb:()=>void)=>{
      const b = BABYLON.GUI.Button.CreateSimpleButton(`b${label}`, label);
      b.thickness = 0; b.background = '#FF6A00'; b.color='#0E0E10'; b.cornerRadius=8; b.fontSize=24; b.height='60px';
      b.onPointerUpObservable.add(()=>cb());
      grid.addControl(b, r, c);
    };

    let n=1;
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){
      const label = String(n++);
      addBtn(r,c,label, ()=>{ this.audio.click(); this.buffer = (this.buffer+label).slice(0,6); display.text = this.buffer.replace(/./g,'•'); });
    }
    addBtn(3,0,'C', ()=>{ this.audio.err(); this.buffer=''; display.text='----'; });
    addBtn(3,1,'0', ()=>{ this.audio.click(); this.buffer = (this.buffer+'0').slice(0,6); display.text = this.buffer.replace(/./g,'•'); });
    addBtn(3,2,'↵', ()=>{
      if(this.buffer === this.code){
        this.isSolved = true; this.audio.ok();
        display.text = 'UNLOCKED'; display.color = '#00FF90';
        setTimeout(()=>{ ui.dispose(); this.onSolved(); }, 400);
      } else {
        this.audio.err(); display.color='#FF7F2A'; display.text='ERROR'; setTimeout(()=>{ display.text='----'; display.color='#00FFF0'; this.buffer=''; }, 400);
      }
    });

    this.ui = panel;
  }

  showHint(level:1|2){
    const msg = level===1 ? 'Look for labels/posters with numbers around the room.' : 'The code is the rack label sequence: 4-2-6-9.';
    (this.scene as any).__toast = msg;
  }

  autoSolve(){ this.buffer = this.code; }
}
