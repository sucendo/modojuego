// 📌 errorChart.js

let errorChartInstance = null;

export function initErrorChart(containerId = 'chartContainer') {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const old = container.querySelector('canvas#errorChart');
  if (old) old.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'errorChart';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (errorChartInstance) errorChartInstance.destroy();

  errorChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Error (px)',
          data: [],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.15)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.28,
          fill: true
        },
        {
          label: 'Mejor error',
          data: [],
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          borderDash: [6, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
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
          grid: { color: 'rgba(255,255,255,0.08)' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#ffcc00' }
        }
      }
    }
  });

  return errorChartInstance;
}

export function updateErrorChart(error, attempt, bestError) {
  if (!errorChartInstance) return;

  errorChartInstance.data.labels.push(attempt);
  errorChartInstance.data.datasets[0].data.push(error);
  errorChartInstance.data.datasets[1].data.push(bestError);
  errorChartInstance.update();
}
