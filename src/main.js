import './style.css'
import Experience from './Experience.js'

// Single entry point. The Experience is a singleton that owns the whole app.
new Experience(document.querySelector('canvas.webgl'))
