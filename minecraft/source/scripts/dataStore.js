export class DataStore {
  constructor() {
    this.data = {};
    this.onChange = () => {};
    this._indexRoot = null;
    this._chunks = new Map();
    this.legacyIceEdits = new Set();
  }

  clear() {
    this.data = {};
    this._indexRoot = null;
    this._chunks.clear();
    this.legacyIceEdits.clear();
  }

  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    return this.data[key] !== undefined;
  }

  get(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const blockId = this.data[key];
    return blockId;
  }

  set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.legacyIceEdits.delete(key);
    this.data[key] = blockId;
    if (this._indexRoot === this.data) {
      const chunkKey=`${chunkX},${chunkZ}`;
      if(!this._chunks.has(chunkKey))this._chunks.set(chunkKey,new Map());
      this._chunks.get(chunkKey).set(`${blockX},${blockY},${blockZ}`,[blockX,blockY,blockZ,blockId]);
    }
    this.onChange();
  }

  remapEdit(chunkX,chunkZ,x,oldY,z,newY,id) {
    const oldKey=this.#getKey(chunkX,chunkZ,x,oldY,z);
    const newKey=this.#getKey(chunkX,chunkZ,x,newY,z);
    delete this.data[oldKey];
    this.data[newKey]=id;
    this.legacyIceEdits.delete(oldKey);
    this._indexRoot=null; // Rebuild the per-chunk index on the next read.
    this.onChange();
  }

  entriesForChunk(chunkX,chunkZ) {
    // Restores may replace `data` directly, hence the identity check.
    if(this._indexRoot !== this.data) {
      this._chunks.clear();this._indexRoot=this.data;
      for (const [key,id] of Object.entries(this.data)) {
        const parts=key.split(',').map(Number);
        if(parts.length!==5 || !parts.every(Number.isFinite))continue;
        const [cx,cz,x,y,z]=parts;
        const chunkKey=`${cx},${cz}`;
        if(!this._chunks.has(chunkKey))this._chunks.set(chunkKey,new Map());
        this._chunks.get(chunkKey).set(`${x},${y},${z}`,[x,y,z,id]);
      }
    }
    return this._chunks.get(`${chunkX},${chunkZ}`)?.values() ?? [];
  }

  #getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
    return `${chunkX},${chunkZ},${blockX},${blockY},${blockZ}`;
  }
}
