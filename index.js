// index.js
const weatherApi = 'https://api.weather.gov/alerts/active?area='

document.addEventListener('DOMContentLoaded', () => {
	const stateInput = document.querySelector('#state-input')
	const fetchButton = document.querySelector('#fetch-alerts')
	const alertsDisplay = document.querySelector('#alerts-display')
	const errorMessage = document.querySelector('#error-message')
	const loadingSpinner = document.querySelector('#loading-spinner')

	function displayError(message) {
		errorMessage.textContent = message
		errorMessage.classList.add('error')
		errorMessage.classList.remove('hidden')
	}

	fetchButton.addEventListener('click', async () => {
		const stateAbbreviation = stateInput.value.trim()
		stateInput.value = ''
		alertsDisplay.replaceChildren()
		errorMessage.textContent = ''
		errorMessage.classList.remove('error')
		errorMessage.classList.add('hidden')

		if (!/^[A-Z]{2}$/.test(stateAbbreviation)) {
			displayError('Enter a state abbreviation using two capital letters.')
			return
		}

		loadingSpinner.classList.remove('hidden')
		fetchButton.disabled = true

		try {
			const response = await fetch(`${weatherApi}${stateAbbreviation}`)
			if (!response.ok) {
				throw new Error(`Request failed (${response.status})`)
			}

			const data = await response.json()
			const features = Array.isArray(data.features) ? data.features : []
			const summary = document.createElement('p')
			summary.textContent = `${data.title}: ${features.length}`
			const headlines = document.createElement('ul')

			features.forEach((feature) => {
				const headline = document.createElement('li')
				headline.textContent = feature.properties?.headline || 'Headline unavailable'
				headlines.append(headline)
			})

			alertsDisplay.append(summary, headlines)
		} catch (error) {
			displayError(error.message)
		} finally {
			loadingSpinner.classList.add('hidden')
			fetchButton.disabled = false
		}
	})
}, { once: true })