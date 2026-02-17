import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'
import { render } from '@test/utils'
import { UI_COPY } from '@shared/application/config/uiCopy'

// Suppress jsdom "Not implemented: navigation to another Document" warning
// triggered when window.location.href is set during GitHub OAuth redirect.
// The Proxy preserves the original location object (so URL resolution in axios/MSW
// still works) but makes the href setter a no-op to prevent jsdom from attempting
// cross-document navigation.
vi.stubGlobal(
  'location',
  new Proxy(window.location, {
    set(_target, prop) {
      if (prop === 'href') return true
      return false
    },
  }),
)

// Mock IntersectionObserver as a proper class
vi.stubGlobal(
  'IntersectionObserver',
  class IntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      // Immediately trigger as visible
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as globalThis.IntersectionObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  },
)

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders landing page for unauthenticated user', async () => {
    await render(<Home />)
    expect(screen.getByText('PeerHub')).toBeInTheDocument()
    expect(screen.getByText(UI_COPY.homeWhyTitle)).toBeInTheDocument()
    expect(screen.getByText(UI_COPY.homeHowTitle)).toBeInTheDocument()
  })

  it('shows feature cards', async () => {
    await render(<Home />)
    expect(screen.getByText('Genuine peer review')).toBeInTheDocument()
    expect(screen.getByText('A reputation you own')).toBeInTheDocument()
    expect(screen.getByText('Stand out to employers')).toBeInTheDocument()
  })

  it('shows CTA buttons', async () => {
    await render(<Home />)
    const loginButtons = screen.getAllByRole('button', { name: UI_COPY.homeLoginCta })
    expect(loginButtons.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(UI_COPY.homeLoginCta).length).toBeGreaterThanOrEqual(1)
  })

  it('redirects to /feed if token exists', async () => {
    localStorage.setItem('token', 'test-token')
    await render(<Home />)
    expect(screen.queryByText(UI_COPY.homeWhyTitle)).not.toBeInTheDocument()
  })

  it('login button is clickable', async () => {
    const user = userEvent.setup()
    await render(<Home />)

    const button = screen.getAllByRole('button', { name: UI_COPY.homeLoginCta })[0]
    await user.click(button)

    // Button should be disabled/loading after click
    expect(button).toBeDisabled()
  })
})
