// 📌 errorChart.js //

let errorChartInstance = null;

export function initErrorChart(containerId = 'chartContainer') {
  const container = document.getElementById(containerId);

  // 1) Elimina el canvas viejo si existía
  const old = container.querySelector('canvas#errorChart');
  if (old) old.remove();

  // 2) Crea uno nuevo SIN atributos de width/height en HTML
  const canvas = document.createElement('canvas');
  canvas.id = 'errorChart';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (errorChartInstance) errorChartInstance.destroy();

  // 3) Inicializa Chart.js responsivo, ajustando al contenedor
  errorChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Error (px)',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,   // <-- permite estirarse al 100% de ancho/alto
      scales: {
        x: {
          title: { display: true, text: 'Intento', color: '#fff' },
          ticks: { color: '#fff' }
        },
        y: {
          title: { display: true, text: 'Error (px)', color: '#fff' },
          ticks: { color: '#fff' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#ffcc00' }
        }
      }
    }
  });
}

export function updateErrorChart(error, attempt) {
  if (!errorChartInstance) return;
  errorChartInstance.data.labels.push(attempt);
  errorChartInstance.data.datasets[0].data.push(error);
  errorChartInstance.update();
}
