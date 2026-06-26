// Edit this file to add your real content later — the 3D world reads from it.
// Each zone places a torii gate + label in the world; driving into it opens a panel.

export const ZONES = [
  {
    id: 'about',
    title: 'About',
    color: '#d64545',
    x: 0,
    z: -40,
    html: `
      <div class="kicker">はじめまして · Hello</div>
      <h2>Harish Gurram</h2>
      <p>Software Developer based in India. I like building things for the web —
      and recently, learning 3D. This whole world is my first Three.js project.</p>
      <p>Drive around and explore the gates to find out more.</p>
    `,
  },
  {
    id: 'projects',
    title: 'Projects',
    color: '#e8702a',
    x: 38,
    z: 12,
    html: `
      <div class="kicker">Work</div>
      <h2>Projects <span class="soon">Coming soon</span></h2>
      <p>I'm still adding my projects here. Once the world is up, this gate will
      open to case studies, demos, and code.</p>
      <p>For now, peek at my <a href="https://github.com/Harish111" target="_blank" rel="noopener">GitHub</a>.</p>
    `,
  },
  {
    id: 'certs',
    title: 'Certifications',
    color: '#e8a93a',
    x: -38,
    z: 12,
    html: `
      <div class="kicker">Credentials</div>
      <h2>Certifications <span class="soon">Coming soon</span></h2>
      <p>Badges and certifications will live behind this gate. Check back as I add them.</p>
    `,
  },
  {
    id: 'contact',
    title: 'Contact',
    color: '#c0392b',
    x: 0,
    z: 52,
    html: `
      <div class="kicker">Say hi</div>
      <h2>Contact</h2>
      <p>📧 <a href="mailto:gurramharish275@gmail.com">gurramharish275@gmail.com</a></p>
      <p>💻 <a href="https://github.com/Harish111" target="_blank" rel="noopener">github.com/Harish111</a></p>
      <p>📍 India</p>
    `,
  },
];
