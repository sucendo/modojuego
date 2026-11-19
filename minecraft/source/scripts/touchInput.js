// Pointer IDs keep movement and looking independent during multi-touch gestures.
export class TouchInput {
  movePointer = null;
  lookPointer = null;
  x = 0;
  forward = 0;
  beginMove(id, x, y) {
    if (this.movePointer !== null) return false;
    this.movePointer = id; this.origin = {x,y}; return true;
  }
  move(id, x, y, radius = 48) {
    if (id !== this.movePointer) return false;
    let dx = (x-this.origin.x)/radius, dy = (y-this.origin.y)/radius;
    const length = Math.hypot(dx,dy);
    if (length > 1) { dx /= length; dy /= length; }
    this.x = Math.abs(dx)<.08 ? 0 : dx;
    this.forward = Math.abs(dy)<.08 ? 0 : -dy;
    return true;
  }
  beginLook(id, x, y) {
    if (this.lookPointer !== null) return false;
    this.lookPointer=id; this.last={x,y}; return true;
  }
  look(id, x, y) {
    if (id !== this.lookPointer) return null;
    const delta={yaw:-(x-this.last.x)*.004,pitch:-(y-this.last.y)*.004};
    this.last={x,y}; return delta;
  }
  end(id) {
    if(id===this.movePointer){this.movePointer=null;this.x=0;this.forward=0;}
    if(id===this.lookPointer)this.lookPointer=null;
  }
  reset(){this.movePointer=null;this.lookPointer=null;this.x=0;this.forward=0;}
}
