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
          label: 'Usuario',
          data: [],
          borderColor: 'rgba(255, 90, 90, 1)',
          backgroundColor: 'rgba(255, 90, 90, 0.14)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.25,
          spanGaps: true
        },
        {
          label: 'IA',
          data: [],
          borderColor: 'rgba(255,255,255,0.95)',
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.25,
          spanGaps: true
        },
        {
          label: 'Mejor error total',
          data: [],
          borderColor: 'rgba(255, 204, 0, 1)',
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.15,
          spanGaps: true
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
              const value = context.raw == null ? '—' : `${Number(context.raw).toFixed(1)} px`;
              return `${context.dataset.label}: ${value}`;
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

export function updateErrorChart(error, attempt, shotType = 'user') {
  if (!errorChartInstance) return;

  bestSoFar = Math.min(bestSoFar, error);
  errorChartInstance.data.labels.push(attempt);
  errorChartInstance.data.datasets[0].data.push(shotType === 'user' ? error : null);
  errorChartInstance.data.datasets[1].data.push(shotType === 'ai' ? error : null);
  errorChartInstance.data.datasets[2].data.push(bestSoFar);
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
