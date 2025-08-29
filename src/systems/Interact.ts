import * as BABYLON from 'babylonjs';

type Target = { mesh: BABYLON.AbstractMesh; label: string; onInteract: ()=>void };

export class InteractSystem {
  private scene: BABYLON.Scene;
  private camera: BABYLON.Camera;
  private highlight: BABYLON.HighlightLayer;
  private targets: Target[] = [];
  current?: Target;

  constructor(scene: BABYLON.Scene, camera: BABYLON.Camera){
    this.scene = scene; this.camera = camera;
    this.highlight = new BABYLON.HighlightLayer('hl', scene, { blurHorizontalSize: 0.5, blurVerticalSize: 0.5 });
  }

  register(mesh: BABYLON.AbstractMesh, label: string, onInteract: ()=>void){
    mesh.metadata = { ...(mesh.metadata||{}), interact: true };
    this.targets.push({ mesh, label, onInteract });
  }

  update(){
    const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, m => !!(m.metadata && m.metadata.interact));
    if(pick && pick.hit && pick.pickedMesh){
      const t = this.targets.find(t => t.mesh === pick.pickedMesh);
      if(this.current?.mesh !== t?.mesh){
        if(this.current) this.highlight.removeMesh(this.current.mesh);
        if(t) { this.current = t; this.highlight.addMesh(t.mesh, BABYLON.Color3.White()); }
      }
    } else {
      if(this.current){ this.highlight.removeMesh(this.current.mesh); this.current = undefined; }
    }
  }

  tryInteract(){
    if(this.current){ this.current.onInteract(); return true; }
    return false;
  }
}
