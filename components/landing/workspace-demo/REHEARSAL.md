# Flux workspace demo rehearsal

The Stageshow `ai-chat` example supplied the cropped window, chat reveal, and streaming answer. Flux adds its source library, workspace colors, typography, and citations with page numbers. The workspace and PDFs are fictional examples.

The cursor focuses the composer, types and sends a question, and moves aside while Flux reads the sources. The answer streams in, the two citations arrive, and the result stays on screen. Playback takes about 10 seconds. Skip and reduced motion go straight to the result. Replay starts a new run.

## Captures and checks

- Chrome rehearsal on the Next.js landing page at 1280px and 390px, in light and dark themes. Contact sheets cover the opening, typing, send, reading, answer, citations, and finish. Reduced-motion stills show the complete answer.
- Browser checks covered keyboard skip, replay, the dashboard CTA, theme and reduced-motion changes, and resizing between desktop, tablet, and phone widths down to 320px.
- The film gate reported `rehearsal passed`. The frame-by-frame timing scan reported sampling gaps, so its timing coverage is inconclusive. Next.js bundles vendor and scene styles together. The local film script used the kit's CSS layer to identify vendor styles and sampled the stage after hydration.
- TypeScript passed in the landing-page rehearsal checkout. The workspace check reported two uses of an undeclared `SUPADATA_API_KEY` in the YouTube parser. The repository's ESLint configuration failed to start because its TypeScript ESLint version does not support TypeScript 7.

## Visual review

- The compact scene uses one toolbar and the chat. A fixed grid column keeps the composer in place throughout the animation and allows the opening copy to wrap.
- The desktop source list ends just below its action. The compact opening identifies each PDF before the answer. The stream uses a shorter fade with less blur.
- The citations stay grouped below the answer, following Flux's existing chat UI.
- The completed frame holds across viewport changes. The simulated cursor fades during the answer and is removed from the completed frame.

The follow-up visual review found the updated desktop and mobile frames legible, with both source files and citations fitting in their intended states. Physical devices, other browser engines, and authenticated navigation were outside this rehearsal.
