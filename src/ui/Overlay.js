/**
 * The HTML HUD over the 3D room: the hover hint pill, the cursor-following hover
 * label, a keyboard-accessible instrument menu, the piano's mode-choice dialog
 * (Composer / Music Learning), a page-fade used when stepping into a player, and
 * a small toast. Elements live under #ui and are toggled by class.
 */
export default class Overlay {
  constructor(experience) {
    this.experience = experience
    this.root = document.getElementById('ui')
    this.root.insertAdjacentHTML('beforeend', this.markup())

    this.hintPill = this.root.querySelector('.hint')
    this.hint = this.root.querySelector('.hint__text')
    this.tooltip = this.root.querySelector('.tooltip')
    this.tooltipName = this.root.querySelector('.tooltip__name')
    this.tooltipTag = this.root.querySelector('.tooltip__tag')
    this.fade = this.root.querySelector('.pagefade')
    this.toastEl = this.root.querySelector('.toast')
    this.choice = this.root.querySelector('.choice')
    this.choiceTitle = this.root.querySelector('.choice__title')
    this.landing = this.root.querySelector('.landing')

    this.hint.textContent = matchMedia('(hover: none)').matches
      ? 'Tap an instrument to step inside'
      : 'Hover an instrument, click to step inside'

    // mode-choice wiring (piano): launch the chosen mode, or fly back on Back
    this.choice.querySelectorAll('[data-mode]').forEach((b) =>
      b.addEventListener('click', () =>
        this.experience.focus.launch(this.experience.focus.focused, b.dataset.mode),
      ),
    )
    this.choice.querySelector('[data-back]').addEventListener('click', () => this.experience.focus.release())
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.choice.classList.contains('is-on')) this.experience.focus.release()
    })

    this.landing.querySelector('[data-enter]').addEventListener('click', () => this.experience.focus.enter())

    this.buildInstrumentMenu()

    window.addEventListener('pointermove', (e) => {
      this._mx = e.clientX // remember the cursor so a fresh hover can place the label
      this._my = e.clientY
      if (!this.tooltip.classList.contains('is-on')) return
      this.tooltip.style.left = `${e.clientX}px`
      this.tooltip.style.top = `${e.clientY}px`
    })
  }

  /** A visually-hidden menu so the experience is fully keyboard / screen-reader operable. */
  buildInstrumentMenu() {
    this.menu = document.createElement('nav')
    this.menu.className = 'a11y-nav'
    this.menu.setAttribute('aria-label', 'Choose an instrument to play')
    const list = document.createElement('ul')
    for (const instrument of this.experience.world.instruments) {
      const li = document.createElement('li')
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = `Play ${instrument.name}, ${instrument.tagline}`
      btn.addEventListener('click', () => this.experience.focus.focus(instrument))
      li.append(btn)
      list.append(li)
    }
    this.menu.append(list)
    this.menu.inert = true // enabled only while browsing
    this.root.append(this.menu)
  }

  showHint() {
    this.hintPill.classList.add('is-on')
    this.menu.inert = false
  }
  hideHint() {
    this.hintPill.classList.remove('is-on')
    this.menu.inert = true
  }

  showLanding() {
    this.landing.classList.remove('is-hidden')
  }
  hideLanding() {
    this.landing.classList.add('is-hidden')
  }

  setHover(instrument) {
    if (instrument) {
      this.tooltipName.textContent = instrument.name
      this.tooltipTag.textContent = instrument.tagline
      this.tooltip.style.setProperty('--accent', instrument.accentHex)
      if (this._mx != null) {
        this.tooltip.style.left = `${this._mx}px` // appear at the cursor on first hover
        this.tooltip.style.top = `${this._my}px`
      }
      this.tooltip.classList.add('is-on')
    } else {
      this.tooltip.classList.remove('is-on')
    }
  }

  /** Piano mode picker. */
  showModeChoice(instrument) {
    this.choiceTitle.textContent = `Play the ${instrument.name}`
    this.choice.style.setProperty('--accent', instrument.accentHex)
    this.choice.classList.add('is-on')
    this.choice.inert = false
  }
  hideModeChoice() {
    this.choice.classList.remove('is-on')
    this.choice.inert = true
  }

  /** Fade the screen out, then run cb (used when stepping into a player). */
  fadeOut(cb) {
    this.fade.classList.add('is-on')
    setTimeout(cb, 380)
  }

  /** Brief centered message (e.g. an instrument with no player yet). */
  toast(message) {
    this.toastEl.textContent = message
    this.toastEl.classList.add('is-on')
    clearTimeout(this._toastT)
    this._toastT = setTimeout(() => this.toastEl.classList.remove('is-on'), 1800)
  }

  markup() {
    return `
      <div class="landing is-hidden">
        <div class="landing__inner">
          <span class="landing__kicker">Play music with your hands</span>
          <h1 class="landing__title">Harm<b>o</b>nic</h1>
          <p class="landing__tagline">A little room full of instruments. Step in, raise a hand, and play, no buttons, just you.</p>
          <button class="btn btn--solid landing__cta" data-enter type="button">Enter the studio</button>
          <span class="landing__cue">Then pick any instrument to play it</span>
        </div>
      </div>

      <div class="hint">
        <span class="hint__dot"></span>
        <span class="hint__text"></span>
      </div>

      <div class="tooltip" role="tooltip" aria-hidden="true">
        <span class="tooltip__swatch"></span>
        <span>
          <span class="tooltip__name"></span><br />
          <span class="tooltip__tag"></span>
        </span>
      </div>

      <div class="choice" role="dialog" aria-modal="true" aria-label="Choose how to play">
        <div class="choice__card">
          <p class="choice__eyebrow">Choose a mode</p>
          <h2 class="choice__title"></h2>
          <div class="choice__opts">
            <button class="choice__opt" data-mode="composer" type="button">
              ${ICON_COMPOSER}
              <span class="choice__opt-name">Composer</span>
              <span class="choice__opt-desc">Free play, just you and the keys</span>
            </button>
            <button class="choice__opt" data-mode="learn" type="button">
              ${ICON_LEARN}
              <span class="choice__opt-name">Music Learning</span>
              <span class="choice__opt-desc">Play along to songs, step by step</span>
            </button>
          </div>
          <button class="choice__back" data-back type="button">${ICON_BACK} Back to studio</button>
        </div>
      </div>

      <div class="toast" role="status"></div>
      <div class="pagefade" aria-hidden="true"></div>
    `
  }
}

const ICON_COMPOSER = `<svg class="choice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
const ICON_LEARN = `<svg class="choice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7l10-4 10 4-10 4z"/><path d="M6 11v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5"/></svg>`
const ICON_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`
