/**
 * @jest-environment jsdom
 */

const fs = require('fs')
const path = require('path')
require('@testing-library/jest-dom')

describe('Weather Alerts App - Input clearing', () => {
  let container
  let fetchMock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ title: "Weather Alerts", features: [] })
    })
    global.fetch = fetchMock
    
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
    document.documentElement.innerHTML = html
    container = document.body

    jest.resetModules()
    require('../index.js')
    document.dispatchEvent(new Event('DOMContentLoaded'))
  })

  it('calls fetch with the correct state in the URL', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)

    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'CA'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://api.weather.gov/alerts/active?area=CA')
  })

  it('displays fetched alert data in the DOM after a successful fetch', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        title: "Weather Alerts",
        features: [
          { properties: { headline: "Flood warning in your area" }},
          { properties: { headline: "Tornado watch for the region" }}
        ]
      })
    })

    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'NY'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    const displayDiv = container.querySelector('#alerts-display')
    expect(displayDiv).toHaveTextContent('Weather Alerts: 2')
    expect(displayDiv).toHaveTextContent('Flood warning in your area')
    expect(displayDiv).toHaveTextContent('Tornado watch for the region')

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        title: "Weather Alerts",
        features: [
          { properties: { headline: "Heat advisory in your area" }},
          { properties: { headline: "Wind warning in your area" }}
        ]
      })
    })

    input.value = 'MN'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(displayDiv).toHaveTextContent('Weather Alerts: 2')
    expect(displayDiv).toHaveTextContent('Heat advisory in your area')
    expect(displayDiv).toHaveTextContent('Wind warning in your area')
    expect(displayDiv).not.toHaveTextContent('Flood warning in your area')
  })

  it('clears the input field after clicking fetch', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)

    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'TX'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(input.value).toBe('')
  })

  it('displays an error message when fetch fails', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)
    fetchMock.mockRejectedValue(new Error('Network failure'))

    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'ZZ'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    const errorDiv = container.querySelector('#error-message')
    expect(errorDiv).not.toHaveClass('hidden')
    expect(errorDiv).toHaveTextContent(/network failure/i)

    fetchMock.mockRejectedValue(new Error('Other issue'))

    input.value = 'ZZ'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(errorDiv).not.toHaveClass('hidden')
    expect(errorDiv).toHaveTextContent(/other issue/i)
  })

  it('clears the error message after a successful fetch', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)

    fetchMock.mockRejectedValue(new Error('Network issue'))

    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'ZZ'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))

    const errorDiv = container.querySelector('#error-message')
    expect(errorDiv).not.toHaveClass('hidden')
    expect(errorDiv).toHaveTextContent(/network issue/i)

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        title: "Weather Alerts",
        features: [
          { properties: { headline: "Heat advisory in your area" } }
        ]
      })
    })

    input.value = 'FL'
    button.click()

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(errorDiv.textContent).toBe('')
    expect(errorDiv).toHaveClass('hidden')
  })

  it('rejects invalid state abbreviations without making a request', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)
    const input = getByPlaceholderText('Enter state abbreviation')
    const button = getByText('Get Weather Alerts')

    input.value = 'ny'
    button.click()

    expect(input.value).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(container.querySelector('#error-message')).toHaveTextContent(/two capital letters/i)
  })

  it('displays an error when the API responds unsuccessfully', async () => {
    const { getByPlaceholderText, getByText } = require('@testing-library/dom').within(container)
    fetchMock.mockResolvedValue({ ok: false, status: 503 })

    getByPlaceholderText('Enter state abbreviation').value = 'NY'
    getByText('Get Weather Alerts').click()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(container.querySelector('#error-message')).toHaveTextContent('Request failed (503)')
  })
})