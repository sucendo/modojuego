// Shared semantic-version assertion for historical Hexategos smoke tests.
// Never pin a test for an old feature to a list of unrelated newer versions.
export function versionAtLeast(text,minimum){
  const source=String(text||'');
  const match=source.match(/<title>[^<]*?\bv(\d+(?:\.\d+){2,3})<\/title>/i)||
    source.match(/\b(?:const|let)\s+(?:BUILD|VERSION)\s*=\s*['"](\d+(?:\.\d+){2,3})['"]/);
  if(!match)return false;
  const a=match[1].split('.').map(Number),b=String(minimum).split('.').map(Number);
  for(let i=0;i<Math.max(a.length,b.length);i++){
    const x=a[i]||0,y=b[i]||0;
    if(x>y)return true;
    if(x<y)return false;
  }
  return true;
}
