/** Compact, contiguous chunk storage. No per-voxel JS objects. */
export class VoxelData {
  constructor(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new RangeError('Invalid chunk size');
    this.width = width;
    this.height = height;
    this.length = width * width * height;
    this.ids = new Uint8Array(this.length);
    // -1 represents no rendered instance; important for swapping mesh instances.
    this.instances = new Int32Array(this.length);
    this.instances.fill(-1);
  }
  contains(x,y,z) { return x>=0 && y>=0 && z>=0 && x<this.width && y<this.height && z<this.width && Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z); }
  index(x,y,z) { return (x*this.height+y)*this.width+z; }
  id(x,y,z) { return this.contains(x,y,z) ? this.ids[this.index(x,y,z)] : 0; }
  instance(x,y,z) { return this.contains(x,y,z) ? this.instances[this.index(x,y,z)] : -1; }
  setId(x,y,z,id) { if (this.contains(x,y,z)) this.ids[this.index(x,y,z)] = id; }
  setInstance(x,y,z,id) { if (this.contains(x,y,z)) this.instances[this.index(x,y,z)] = id === null ? -1 : id; }
  get byteLength() { return this.ids.byteLength + this.instances.byteLength; }
}
