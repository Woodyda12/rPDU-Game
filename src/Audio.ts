// Minimal sound stubs (you can swap for Babylon Sound later if you add assets)
export class AudioBus {
  private ctx?: AudioContext;
  private enabled = true;
  private ensure(){ if(!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
  click(){ if(!this.enabled) return; this.ensure(); const o=this.ctx!.createOscillator(); const g=this.ctx!.createGain();
    o.type='square'; o.frequency.value=600; g.gain.value=0.04; o.connect(g); g.connect(this.ctx!.destination);
    o.start(); setTimeout(()=>o.stop(), 60);
  }
  ok(){ if(!this.enabled) return; this.ensure(); const o=this.ctx!.createOscillator(); const g=this.ctx!.createGain();
    o.type='triangle'; o.frequency.value=880; g.gain.value=0.05; o.connect(g); g.connect(this.ctx!.destination);
    o.start(); setTimeout(()=>o.stop(), 120);
  }
  err(){ if(!this.enabled) return; this.ensure(); const o=this.ctx!.createOscillator(); const g=this.ctx!.createGain();
    o.type='sawtooth'; o.frequency.value=220; g.gain.value=0.06; o.connect(g); g.connect(this.ctx!.destination);
    o.start(); setTimeout(()=>o.stop(), 160);
  }
  setEnabled(v:boolean){ this.enabled=v; }
}
