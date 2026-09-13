# Mido — In the Clouds

Galaxy landing page for Mido. Static HTML/CSS/JS rebuild of the Canva website design
(https://canva.link/jgfmxejfaw0esel).

## Live

Repository: https://github.com/Sankavi1605/mido

## Run

Any static server works. For example:

```bash
python -m http.server 8765
```

Then open http://localhost:8765. Opening `index.html` directly from disk also
works, but the video autoplays more reliably over http.

## Structure

```
index.html          page markup (5 sections)
css/style.css       layout, hero galaxy-text effect, mobile layout
js/main.js          scroll reveal, parallax, hero mouse parallax, video control
assets/img/         16 PNG/JPG sprites exported from the design
assets/video/       asteroid clip (704p + 640p) and poster frame
assets/fonts/       Lora (regular/bold/italic) and Arimo, self-hosted
```

## How the layout works

The Canva design was measured on a 1024 px wide canvas. Every element stores
its design-pixel position in CSS custom properties (`--x`, `--y`, `--w`, `--hh`)
and the stylesheet multiplies them by `--u` (one design pixel in real pixels,
`100vw / 1024`). The whole page therefore scales fluidly like the Canva viewer.

Below 720 px the sections reflow into a stacked mobile layout with readable
type sizes.

## Hero "galaxy text" effect

Canva builds the hero by multiplying a white-on-black "Mido" cutout over the
galaxy layers so the galaxy only shows inside the letters. The site reproduces
this exactly with `mix-blend-mode: multiply` on `assets/img/hero-cutout.png`,
plus a slow drift animation on the star layer and a mouse parallax.

## Notes

- Stock elements inside the design are subject to Canva's content licence.
- The design text ended with "take flightClouds"; this rebuild uses
  "take flight." Edit the paragraphs in `index.html` as needed.
