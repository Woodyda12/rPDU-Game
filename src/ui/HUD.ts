import * as BABYLON from 'babylonjs';
import 'babylonjs-gui';

export class HUD {
  ui: BABYLON.GUI.AdvancedDynamicTexture;
  timerText: BABYLON.GUI.TextBlock;
  interactText: BABYLON.GUI.TextBlock;
  hintBtn: BABYLON.GUI.Button;
  hintPanel: BABYLON.GUI.Rectangle;
  pausePanel: BABYLON.GUI.Rectangle;
  winPanel: BABYLON.GUI.Rectangle;

  private startTime = 0;
  private pausedAt = 0;
  private running = false;
  private showHints = true;
  private lastShownHint?: string;

  constructor(scene: BABYLON.Scene, color='#FF6A00', accent='#00FFF0'){
    this.ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Timer
    this.timerText = new BABYLON.GUI.TextBlock('timer', '00:00');
    this.timerText.color = '#FFFFFF';
    this.timerText.fontSize = 36;
    this.timerText.fontFamily = 'monospace';
    this.timerText.top = '12px';
    this.timerText.left = '12px';
    this.timerText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.timerText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(this.timerText);

    // Interact prompt
    this.interactText = new BABYLON.GUI.TextBlock('interact', '');
    this.interactText.color = accent;
    this.interactText.fontSize = 20;
    this.interactText.fontFamily = 'system-ui';
    this.interactText.bottom = '16px';
    this.interactText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.ui.addControl(this.interactText);

    // Hint button
    this.hintBtn = BABYLON.GUI.Button.CreateSimpleButton('hint', '?');
    this.hintBtn.width = '40px'; this.hintBtn.height = '40px';
    this.hintBtn.color = '#0E0E10'; this.hintBtn.background = color;
    this.hintBtn.cornerRadius = 8; this.hintBtn.thickness = 0;
    this.hintBtn.right = '12px'; this.hintBtn.top = '12px';
    this.hintBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.hintBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.ui.addControl(this.hintBtn);

    // Hint panel
    this.hintPanel = new BABYLON.GUI.Rectangle('hintPanel');
    this.hintPanel.width = 0.5; this.hintPanel.height = '150px';
    this.hintPanel.thickness = 0; this.hintPanel.background = 'rgba(26,26,29,0.95)';
    this.hintPanel.cornerRadius = 12; this.hintPanel.isVisible = false;
    const hintText = new BABYLON.GUI.TextBlock('hintText','');
    hintText.color = '#FFFFFF'; hintText.fontSize = 20; hintText.textWrapping = true; hintText.paddingTop = '16px'; hintText.paddingLeft='20px'; hintText.paddingRight='20px';
    this.hintPanel.addControl(hintText);
    (this.hintPanel as any)._text = hintText;
    this.ui.addControl(this.hintPanel);

    // Pause panel
    this.pausePanel = this.makeModal('PAUSED\nPress P or Esc to resume');
    this.pausePanel.isVisible = false;

    // Win panel
    this.winPanel = this.makeModal('SYSTEM RESTORED');
    this.winPanel.isVisible = false;
  }

  private makeModal(text: string){
    const panel = new BABYLON.GUI.Rectangle();
    panel.width = 0.6; panel.height = 0.5; panel.thickness = 0; panel.background = 'rgba(26,26,29,0.95)'; panel.cornerRadius = 12;
    const t = new BABYLON.GUI.TextBlock('', text);
    t.color = '#FFFFFF'; t.fontSize = 28; t.textWrapping = true; t.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.addControl(t);
    this.ui.addControl(panel);
    return panel;
  }

  setInteractLabel(label?: string){ this.interactText.text = label ? `E — ${label}` : ''; }

  onHintClick(cb: ()=>void){ this.hintBtn.onPointerUpObservable.add(cb); }

  showHint(text: string){
    if(!this.showHints) return;
    (this.hintPanel as any)._text.text = text;
    this.hintPanel.isVisible = true;
    this.lastShownHint = text;
  }

  hideHint(){ this.hintPanel.isVisible = false; }

  toggleHints(){ this.showHints = !this.showHints; if(!this.showHints) this.hideHint(); }

  startTimer(){ if(this.running) return; this.startTime = performance.now(); this.running = true; }

  pauseTimer(){ if(!this.running) return; this.pausedAt = performance.now(); this.running = false; }

  resumeTimer(){ if(this.running) return; this.startTime += (performance.now() - this.pausedAt); this.running = true; }

  resetTimer(){ this.startTime = performance.now(); }

  getElapsedMS(){ return (this.running ? performance.now() : this.pausedAt) - this.startTime; }

  update(){
    const ms = this.getElapsedMS();
    const s = Math.max(0, Math.floor(ms/1000));
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    this.timerText.text = `${mm}:${ss}`;
  }

  showPause(v:boolean){ this.pausePanel.isVisible = v; }
  showWin(title: string, subtitle: string, onRestart: ()=>void){
    const container = this.winPanel;
    (container.children[0] as BABYLON.GUI.TextBlock).text = `${title}\n\n${subtitle}`;
    // Add Play Again button
    const btn = BABYLON.GUI.Button.CreateSimpleButton('again','Play Again');
    btn.width = '180px'; btn.height = '50px'; btn.color = '#0E0E10'; btn.background = '#FF6A00'; btn.thickness=0; btn.cornerRadius=10;
    btn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    btn.bottom = '20px';
    btn.onPointerUpObservable.add(()=>onRestart());
    container.addControl(btn);
    container.isVisible = true;
  }
}
