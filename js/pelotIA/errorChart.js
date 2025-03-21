// 📌 errorChart.js //

let errorChartInstance = null;

export function initErrorChart(containerId = 'chartContainer') {
	const container = document.getElementById(containerId);

	const oldCanvas = container.querySelector('canvas');
	if (oldCanvas) oldCanvas.remove();

	const newCanvas = document.createElement('canvas');
	newCanvas.id = 'errorChart';
	container.appendChild(newCanvas);

	const ctx = newCanvas.getContext('2d');
	if (errorChartInstance) errorChartInstance.destroy();

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
	if (errorChartInstance) {
		errorChartInstance.data.labels.push(attempt);
		errorChartInstance.data.datasets[0].data.push(error);
		errorChartInstance.update();
	}
}
