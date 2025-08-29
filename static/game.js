(() => {
  const ORANGE = '#FF6A00', CYAN='#00FFF0', GREEN='#00FF90', BG='#0E0E10';
  const CONFIG = {
    powerSequence:[2,4,1,3],
    keypadCode:'4269',
    cableMap:{A:2,B:4,C:1,D:3},
    thermalTarget:{min:22, max:24},
    easter:{seq:[3,1,4,2], win:10}
  };

  const canvas = document.getElementById('game');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.FromHexString(BG));
  const cam = new BABYLON.UniversalCamera('c', new BABYLON.Vector3(0,1.7,-4), scene);
  cam.attachControl(true); cam.speed=0.15; cam.angularSensibility=2500;
  scene.onPointerDown = ()=>{ if(document.pointerLockElement !== canvas) canvas.requestPointerLock(); };
  new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0,1,0), scene).intensity=0.9;
  new BABYLON.GlowLayer('gl', scene, { intensity:0.3 });

  // Room
  const size=8, height=3;
  const wallM = new BABYLON.StandardMaterial('wm', scene);
  wallM.diffuseColor = BABYLON.Color3.FromHexString('#1A1A1D');
  const box=(w,h,d,pos)=>{ const m= BABYLON.MeshBuilder.CreateBox('w',{width:w,height:h,depth:d},scene); m.position=pos; m.material=wallM; return m; };
  box(size,0.1,size,new BABYLON.Vector3(0,0,0));
  box(size,0.1,size,new BABYLON.Vector3(0,height,0));
  box(size,height,0.1,new BABYLON.Vector3(0,height/2,size/2));
  box(size,height,0.1,new BABYLON.Vector3(0,height/2,-size/2));
  box(0.1,height,size,new BABYLON.Vector3(-size/2,height/2,0));
  box(0.1,height,size,new BABYLON.Vector3(size/2,height/2,0));

  // Door
  const door = BABYLON.MeshBuilder.CreateBox('door',{width:1.6,height:2.4,depth:0.08},scene);
  door.position = new BABYLON.Vector3(0,1.2,-size/2+0.04);
  const doorM = new BABYLON.StandardMaterial('dm', scene);
  doorM.diffuseColor = BABYLON.Color3.FromHexString('#0E0E10'); doorM.emissiveColor = BABYLON.Color3.FromHexString(ORANGE).scale(0.25);
  door.material = doorM;

  // Panels
  const panelM = c=>{ const m=new BABYLON.StandardMaterial('pm',scene); m.diffuseColor=BABYLON.Color3.FromHexString('#1A1A1D'); m.emissiveColor=BABYLON.Color3.FromHexString(c).scale(0.15); return m; };
  const mkPanel=(name,pos,c)=>{ const p=BABYLON.MeshBuilder.CreateBox(name,{width:1.2,height:1,depth:0.08},scene); p.position=pos; p.material=panelM(c); p.metadata={interact:true}; return p; };
  const keypad = mkPanel('keypad', new BABYLON.Vector3(-2.5,1.2,-size/2+0.04), CYAN);
  const cable  = mkPanel('cable',  new BABYLON.Vector3( 2.5,1.2,-size/2+0.04), CYAN);
  const therm  = mkPanel('therm',  new BABYLON.Vector3( 0.0,0.9, size/2-0.04), CYAN);

  // Power panel (right wall)
  const powerRoot = new BABYLON.TransformNode('pow', scene);
  powerRoot.position = new BABYLON.Vector3(size/2-0.1,0,0);
  const host = BABYLON.MeshBuilder.CreateBox('powHost',{width:1.2,height:1.2,depth:0.1},scene);
  host.position = new BABYLON.Vector3(-0.6,1.2,0); host.parent=powerRoot; host.material=panelM(ORANGE);
  const levers=[];
  for(let i=0;i<4;i++){
    const l=BABYLON.MeshBuilder.CreateBox('lev'+(i+1),{width:0.15,height:0.6,depth:0.15},scene);
    l.parent=powerRoot; l.position=new BABYLON.Vector3(-1.05+i*0.3,1.2,0.08);
    l.metadata={interact:true}; const lm=new BABYLON.StandardMaterial('lm',scene); lm.diffuseColor=new BABYLON.Color3(0.1,0.1,0.1); lm.emissiveColor=BABYLON.Color3.FromHexString(CYAN).scale(0.4); l.material=lm; levers.push(l);
  }
  // Poster
  const poster = BABYLON.MeshBuilder.CreatePlane('poster',{width:1.1,height:0.6},scene);
  poster.position = new BABYLON.Vector3(-0.6,2.4,0.02); poster.parent=powerRoot;
  const dt = new BABYLON.DynamicTexture('pdt',{width:512,height:256},scene,true);
  const ctx=dt.getContext(); ctx.fillStyle=BG; ctx.fillRect(0,0,512,256); ctx.fillStyle=ORANGE; ctx.font='bold 42px monospace'; ctx.fillText('BOOT ORDER',110,60); ctx.fillStyle=GREEN; ctx.font='32px monospace'; ctx.fillText(CONFIG.powerSequence.join(' → '),180,180); dt.update();
  const pm=new BABYLON.StandardMaterial('pm',scene); pm.diffuseTexture=dt; poster.material=pm;

  // HUD
  const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
  const timer = new BABYLON.GUI.TextBlock('', '00:00'); timer.color='#FFFFFF'; timer.fontSize=36; timer.fontFamily='monospace'; timer.top='12px'; timer.left='12px'; timer.textHorizontalAlignment=0; timer.textVerticalAlignment=0;
  const hintBtn = BABYLON.GUI.Button.CreateSimpleButton('hint','?'); hintBtn.width='40px'; hintBtn.height='40px'; hintBtn.thickness=0; hintBtn.cornerRadius=8; hintBtn.color='#0E0E10'; hintBtn.background=ORANGE; hintBtn.right='12px'; hintBtn.top='12px'; hintBtn.horizontalAlignment=2; hintBtn.verticalAlignment=0;
  const interact = new BABYLON.GUI.TextBlock('', ''); interact.color=CYAN; interact.fontSize=20; interact.textVerticalAlignment=2; interact.bottom='16px';
  ui.addControl(timer); ui.addControl(hintBtn); ui.addControl(interact);
  const hintPanel = new BABYLON.GUI.Rectangle(); hintPanel.width=0.5; hintPanel.height='150px'; hintPanel.thickness=0; hintPanel.cornerRadius=12; hintPanel.background='rgba(26,26,29,0.95)'; hintPanel.isVisible=false;
  const hintText = new BABYLON.GUI.TextBlock('', ''); hintText.color='#FFFFFF'; hintText.fontSize=20; hintText.textWrapping=true; hintText.paddingTop='16px'; hintText.paddingLeft='20px'; hintText.paddingRight='20px';
  hintPanel.addControl(hintText); ui.addControl(hintPanel);

  const hl = new BABYLON.HighlightLayer('hl', scene, { blurHorizontalSize:0.5, blurVerticalSize:0.5 });

  let running=false, t0=0, paused=false, pausedAt=0, solved=new Set();
  const start = ()=>{ if(!running){ running=true; t0=performance.now(); } };
  const elapsedMS = ()=> (running?performance.now():pausedAt) - t0;
  function updateTimer(){
    const s = Math.floor(elapsedMS()/1000); const mm=String(Math.floor(s/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0'); timer.text=`${mm}:${ss}`;
  }

  let focus=null;
  scene.onBeforeRenderObservable.add(()=>{
    const pick = scene.pick(scene.pointerX, scene.pointerY, m=>m.metadata&&m.metadata.interact);
    if(pick?.hit){ if(focus!==pick.pickedMesh){ if(focus) hl.removeMesh(focus); focus=pick.pickedMesh; hl.addMesh(focus, BABYLON.Color3.White()); } }
    else { if(focus){ hl.removeMesh(focus); focus=null; } }
    interact.text = focus ? `E — ${focus.name === 'keypad' ? 'Access Keypad' : focus.name === 'cable' ? 'Cable Routing' : focus.name === 'therm' ? 'Thermal Control' : 'Power Sequencer'}` : '';
    updateTimer();
  });

  const eggHist=[];

  function openDoor(){
    const anim = new BABYLON.Animation('doorOpen','position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    anim.setKeys([{frame:0,value:door.position.y},{frame:60,value:door.position.y+2.6}]);
    door.animations=[anim]; scene.beginAnimation(door,0,60,false,1, ()=> showWin());
  }
  function showWin(){
    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.6; panel.height=0.5; panel.thickness=0; panel.cornerRadius=12; panel.background='rgba(26,26,29,0.95)';
    const t = new BABYLON.GUI.TextBlock('', `SYSTEM RESTORED\n\nTime: ${timer.text}`); t.color='#FFFFFF'; t.fontSize=28; t.textWrapping=true; panel.addControl(t);
    const b = BABYLON.GUI.Button.CreateSimpleButton('again','Play Again'); b.width='180px'; b.height='50px'; b.color='#0E0E10'; b.background=ORANGE; b.cornerRadius=10; b.verticalAlignment=2; b.bottom='20px'; b.onPointerUpObservable.add(()=>location.reload());
    panel.addControl(b); ui.addControl(panel);
  }

  function toast(s){ hintText.text=s; hintPanel.isVisible=true; setTimeout(()=> hintPanel.isVisible=false, 1500); }

  // Interact key
  window.addEventListener('keydown', ev=>{
    if(ev.key==='e' || ev.key==='E'){ start();
      if(!focus) return;
      if(focus.name.startsWith('lev')){
        const idx = parseInt(focus.name.replace('lev',''),10);
        const anim = new BABYLON.Animation('tilt','rotation.x', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
        anim.setKeys([{frame:0,value:0},{frame:6,value:-0.5},{frame:12,value:0}]); focus.animations=[anim]; scene.beginAnimation(focus,0,12,false);
        eggHist.push({i:idx, t:performance.now()}); const win=CONFIG.easter.win*1000; while(eggHist.length>4) eggHist.shift();
        if(eggHist.length===4 && eggHist[3].t-eggHist[0].t<=win){
          const seq=eggHist.map(x=>x.i).join(',');
          if(seq===CONFIG.easter.seq.join(',')){ [door,keypad,cable,therm].forEach(m=>{
            const mat=(m.material)|| new BABYLON.StandardMaterial('nm',scene);
            mat.emissiveColor = BABYLON.Color3.FromHexString(ORANGE).scale(0.8); m.material=mat;
          }); toast('MARGINHUNTER unlocked — Cost Saved!'); }
        }
        if(!window._pow) window._pow=[];
        window._pow.push(idx);
        const k=window._pow.length, seq=CONFIG.powerSequence;
        if(window._pow[k-1]!==seq[k-1]){ window._pow=[]; toast('Wrong breaker order'); }
        else if(k===4){ solved.add('power'); toast('Power restored'); }
      }
      else if(focus===keypad){ openKeypad(); }
      else if(focus===cable){ openCable(); }
      else if(focus===therm){ openTherm(); }
    }
    if(ev.key==='p'||ev.key==='P'||ev.key==='Escape'){ if(!paused){ paused=true; running=false; pausedAt=performance.now(); engine.stopRenderLoop(); }
      else { paused=false; running=true; t0 += (performance.now()-pausedAt); engine.runRenderLoop(()=>scene.render()); } }
    if(ev.key==='r'||ev.key==='R'){ location.reload(); }
    if(ev.key==='h'||ev.key==='H'){ hintPanel.isVisible = !hintPanel.isVisible; }
  });

  function checkAll(){ if(solved.size>=4) openDoor(); }

  function openKeypad(){
    if(solved.has('keypad')) return;
    const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('K', true, scene);
    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.36; panel.height=0.6; panel.background='rgba(26,26,29,0.98)'; panel.cornerRadius=12; panel.thickness=0; adt.addControl(panel);
    let buf='';
    const disp = new BABYLON.GUI.TextBlock('', '----'); disp.height='60px'; disp.color=CYAN; disp.fontSize=28; disp.top='12px'; panel.addControl(disp);
    const grid = new BABYLON.GUI.Grid(); for(let i=0;i<4;i++) grid.addRowDefinition(0.25); for(let i=0;i<3;i++) grid.addColumnDefinition(0.333); grid.top='80px'; grid.width=0.9; grid.height=0.7; panel.addControl(grid);
    const add=(r,c,label,cb)=>{ const b=BABYLON.GUI.Button.CreateSimpleButton('b'+label,label); b.thickness=0; b.background=ORANGE; b.color=BG; b.cornerRadius=8; b.fontSize=24; b.height='60px'; b.onPointerUpObservable.add(cb); grid.addControl(b,r,c); };
    let n=1; for(let r=0;r<3;r++) for(let c=0;c<3;c++){ const label=String(n++); add(r,c,label,()=>{ buf=(buf+label).slice(0,6); disp.text=buf.replace(/./g,'•'); }); }
    add(3,0,'C',()=>{ buf=''; disp.text='----'; });
    add(3,1,'0',()=>{ buf=(buf+'0').slice(0,6); disp.text=buf.replace(/./g,'•'); });
    add(3,2,'↵',()=>{ if(buf===CONFIG.keypadCode){ disp.text='UNLOCKED'; disp.color=GREEN; solved.add('keypad'); setTimeout(()=>{ adt.dispose(); checkAll(); }, 300);} else { disp.text='ERROR'; disp.color='#FF7F2A'; setTimeout(()=>{ disp.text='----'; disp.color=CYAN; buf=''; }, 400);} });
  }

  function openCable(){
    if(solved.has('cable')) return;
    const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('C', true, scene);
    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.6; panel.height=0.6; panel.background='rgba(26,26,29,0.98)'; panel.cornerRadius=12; panel.thickness=0; adt.addControl(panel);
    const grid=new BABYLON.GUI.Grid(); grid.width=0.9; grid.height=0.75; grid.top='40px'; grid.addColumnDefinition(0.5); grid.addColumnDefinition(0.5); grid.addRowDefinition(1); panel.addControl(grid);
    const left=new BABYLON.GUI.StackPanel(); left.isVertical=true; left.spacing=10;
    const right=new BABYLON.GUI.StackPanel(); right.isVertical=true; right.spacing=10; grid.addControl(left,0,0); grid.addControl(right,0,1);
    const ports={}, placed={};
    for(let p=1;p<=4;p++){ const r=new BABYLON.GUI.Rectangle(); r.height='60px'; r.thickness=2; r.color=ORANGE; r.background='rgba(14,14,16,0.8)'; r.cornerRadius=8; const t=new BABYLON.GUI.TextBlock('',`PORT ${p}`); t.color=CYAN; t.fontSize=20; r.addControl(t); right.addControl(r); ports[p]=r; }
    const mk=(name,color)=>{ const r=new BABYLON.GUI.Rectangle(); r.height='60px'; r.thickness=0; r.background=color; r.cornerRadius=8; const t=new BABYLON.GUI.TextBlock('',`CABLE ${name}`); t.color=BG; t.fontSize=20; r.addControl(t); r.draggable=true; r.onPointerDragEndObservable.add(()=>{ let best=null, bd=1e9; for(const p in ports){ const dx=r.centerX-ports[p].centerX, dy=r.centerY-ports[p].centerY; const d=dx*dx+dy*dy; if(d<bd){ bd=d; best=+p; } } placed[name]=best; r.left=ports[best].left; r.top=ports[best].top; if(Object.keys(placed).length===4){ const ok=Object.entries(CONFIG.cableMap).every(([k,v])=>placed[k]===v); if(ok){ solved.add('cable'); adt.dispose(); checkAll(); } else { toast('Wrong mapping'); } } }); left.addControl(r); };
    mk('A',ORANGE); mk('B','#FF7F2A'); mk('C',CYAN); mk('D',GREEN);
  }

  function openTherm(){
    if(solved.has('therm')) return;
    const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('T', true, scene);
    const panel = new BABYLON.GUI.Rectangle(); panel.width=0.6; panel.height=0.55; panel.background='rgba(26,26,29,0.98)'; panel.cornerRadius=12; panel.thickness=0; adt.addControl(panel);
    const temp=new BABYLON.GUI.TextBlock('', 'Temp: -- °C'); temp.color=CYAN; temp.fontSize=28; temp.top='50px'; panel.addControl(temp);
    let fan=50,vent=50,baf=50, stable=0;
    const compute=()=>{ const t=10+0.12*fan+0.1*vent+0.08*baf; temp.text=`Temp: ${t.toFixed(1)} °C (Target ${CONFIG.thermalTarget.min}–${CONFIG.thermalTarget.max})`; if(t>=CONFIG.thermalTarget.min&&t<=CONFIG.thermalTarget.max){ stable+=0.1; if(stable>=1){ solved.add('thermal'); adt.dispose(); checkAll(); } } else stable=0; };
    const mk=(label,top,cb)=>{ const s=new BABYLON.GUI.Slider(); const l=new BABYLON.GUI.TextBlock('',label); const stack=new BABYLON.GUI.StackPanel(); stack.top=top; stack.height='100px'; stack.isVertical=true;
      l.color='#FFFFFF'; l.height='30px'; s.minimum=0; s.maximum=100; s.value=50; s.height='20px'; s.color=ORANGE; s.background='#1A1A1D'; s.borderColor='#1A1A1D'; s.onValueChangedObservable.add(cb);
      stack.addControl(l); stack.addControl(s); panel.addControl(stack); };
    mk('Fan RPM','110px', v=>{fan=v; compute();}); mk('Vent Flow','210px', v=>{vent=v; compute();}); mk('Baffle Angle','310px', v=>{baf=v; compute();}); compute();
  }

  // Idle hint
  let lastInput=performance.now();
  scene.onKeyboardObservable.add(()=>lastInput=performance.now());
  scene.onPointerObservable.add(()=>lastInput=performance.now());
  scene.onAfterRenderObservable.add(()=>{ if(performance.now()-lastInput>60000) { toast('Stuck? Tap ? and use hints.'); lastInput=performance.now(); } });

  // Solve flow
  const checkAll = ()=>{ if(solved.size>=4) openDoor(); };

  engine.runRenderLoop(()=> scene.render());
  window.addEventListener('resize', ()=> engine.resize());

  // Timer start on first any input
  const startOnAny = ()=>{ window.removeEventListener('keydown', startOnAny); window.removeEventListener('mousedown', startOnAny); t0 = performance.now(); running=true; };
  window.addEventListener('keydown', startOnAny); window.addEventListener('mousedown', startOnAny);
})();
