export function initHudToggles({ setShowLabels, gridController, getGridMeshes, getFallbackGrid }){
  const toggleGrid = document.getElementById("toggleGrid");
  const toggleNames = document.getElementById("toggleNames");

  if (toggleGrid){
    const applyGrid = () => {
      const on = !!toggleGrid.checked;

      // Nuevo camino recomendado: controller UI (lazy/dispose)
      if (gridController && typeof gridController.setEnabled === "function"){
        gridController.setEnabled(on);
        return;
      }

      // Compat: viejo sistema por meshes directos  
      const gm = getGridMeshes ? getGridMeshes() : null;
      if (gm && gm.length){
        for (const m of gm) if (m) m.setEnabled(on);
        return;
      }
      const fb = getFallbackGrid ? getFallbackGrid() : null;
      if (!fb) return;
      if (fb.grid) fb.grid.setEnabled(on);
      if (fb.gridV) fb.gridV.setEnabled(on);
      if (fb.axes) fb.axes.setEnabled(on);
    };

    // aplica estado inicial
    applyGrid();
    toggleGrid.addEventListener("change", applyGrid);
  }

  if (toggleNames){
    setShowLabels(!!toggleNames.checked);
    toggleNames.addEventListener("change", () => setShowLabels(!!toggleNames.checked));
  }
}