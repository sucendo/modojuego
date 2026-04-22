let errorChartInstance = null;
let bestSoFar = Infinity;

export function initErrorChart(containerId = 'chartContainer') {
  const container = document.getElementById(containerId);
  if (!container) return null;

  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.id = 'errorChart';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (errorChartInstance) errorChartInstance.destroy();
  bestSoFar = Infinity;

  errorChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Error por intento',
          data: [],
          backgroundColor: 'rgba(255, 99, 132, 0.14)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 4,
          tension: 0.28,
          fill: false
        },
        {
          label: 'Mejor error acumulado',
          data: [],
          backgroundColor: 'rgba(255, 204, 0, 0.12)',
          borderColor: 'rgba(255, 204, 0, 1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { color: '#ffefb0' }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = Number(context.raw ?? 0).toFixed(1);
              return `${context.dataset.label}: ${value} px`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Intento', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          title: { display: true, text: 'Error (px)', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          beginAtZero: true
        }
      }
    }
  });

  return errorChartInstance;
}

export function updateErrorChart(error, attempt) {
  if (!errorChartInstance) return;

  bestSoFar = Math.min(bestSoFar, error);
  errorChartInstance.data.labels.push(attempt);
  errorChartInstance.data.datasets[0].data.push(error);
  errorChartInstance.data.datasets[1].data.push(bestSoFar);
  errorChartInstance.update('none');
}

export function clearErrorChart() {
  bestSoFar = Infinity;
  if (!errorChartInstance) return;
  errorChartInstance.data.labels = [];
  errorChartInstance.data.datasets.forEach(dataset => {
    dataset.data = [];
  });
  errorChartInstance.update();
}

export function destroyErrorChart() {
  if (errorChartInstance) {
    errorChartInstance.destroy();
    errorChartInstance = null;
  }
}
