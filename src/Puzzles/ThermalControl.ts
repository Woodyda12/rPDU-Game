import * as BABYLON from 'babylonjs';
import 'babylonjs-gui';
import { AudioBus } from '../../systems/Audio';

export class ThermalControl {
  isSolved = false;
  private scene: BABYLON.Scene;
  private onSolved: ()=>void;
  private target: {min:number; max:number};
  private audio: AudioBus;

  constructor(scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh, target: {min:number; max:number}, audio: AudioBus, onSolved: ()=>void){
    this.scene=scene; this.onSolved=onSolved; this.target=target; this.audio=audio;
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, ()=>this.open()));
  }

  private open(){
    if(this.isSolved) return;
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('ThermUI', true, this.scene);
    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.6; panel.height=0.55; panel.thickness=0; panel.cornerRadius=12; panel.background='rgba(26,26,29,0.98)';
    ui.addControl(panel);

    const title = new BABYLON.GUI.TextBlock('', 'Thermal Control — reach target temperature');
    title.color='#FFFFFF'; title.fontSize=22; title.top='10px'; panel.addControl(title);

    const tempText = new BABYLON.GUI.TextBlock('', 'Temp: -- °C'); tempText.color='#00FFF0'; tempText.fontSize=28; tempText.top='50px';
    panel.addControl(tempText);

    const makeSlider = (label:string, top:string, onChange:(v:number)=>void)=>{
      const stack = new BABYLON.GUI.StackPanel(); stack.top=top; stack.height='100px'; stack.isVertical=true;
      const l = new BABYLON.GUI.TextBlock('', label); l.color='#FFFFFF'; l.fontSize=18; l.height='30px';
      const s = new BABYLON.GUI.Slider(); s.minimum=0; s.maximum=100; s.height='20px'; s.color='#FF6A00'; s.background='#1A1A1D'; s.borderColor='#1A1A1D'; s.value=50;
      s.onValueChangedObservable.add(onChange);
      stack.addControl(l); stack.addControl(s); panel.addControl(stack);
      return s;
    };

    let fan=50, vent=50, baffle=50, stableTime=0;
    const compute = ()=>{
      const temp = 10 + 0.12*fan + 0.1*vent + 0.08*baffle; // 10..~42
      tempText.text = `Temp: ${temp.toFixed(1)} °C (Target ${this.target.min}–${this.target.max})`;
      if(temp >= this.target.min && temp <= this.target.max){
        stableTime += 0.1;
        if(stableTime>=1.0 && !this.isSolved){
          this.isSolved = true; this.audio.ok(); (this.scene as any).__toast = 'Cooling stable.';
          setTimeout(()=>{ ui.dispose(); this.onSolved(); }, 300);
        }
      } else stableTime = 0;
    };

    makeSlider('Fan RPM','110px', v=>{ fan=v; compute(); });
    makeSlider('Vent Flow','210px', v=>{ vent=v; compute(); });
    makeSlider('Baffle Angle','310px', v=>{ baffle=v; compute(); });
    compute();
  }

  showHint(level:1|2){
    (this.scene as any).__toast = level===1 ? 'Use all three controls; changes are interdependent.' : 'Aim for 22–24 °C by balancing fan/vent/baffle.';
  }

  autoSolve(){ /* UI-time */ }
}
