# Stack Order: Library of Congress

A standalone browser game for practicing complex Library of Congress call-number
sorting across the major LC classes.

This project is separate from `SBUVictor/music-sorting-game`. It borrows the
same broad lesson, quiz, and final sorting shape, but it does not modify or
depend on that repository.

## What It Teaches

- LC class-letter order across the major classes
- Subclass comparison, such as `BF`, `HD`, `QA`, and `Z`
- Numeric class-number comparison, including decimals
- Cutter comparison by letter and decimal digit value
- Second Cutters
- Dates, volumes, parts, supplements, numbers, and copy suffixes
- A final drag/tap sorting activity
- SBU email validation
- Score submission to the existing SBU training scoreboard Apps Script
- Grade email delivery through the connected Apps Script

## Sources

The training rules and examples were built from these Library of Congress
resources:

- Library of Congress Classification Outline:
  https://www.loc.gov/catdir/cpso/lcco/lccowp.html
- Library of Congress Classification PDF Files:
  https://www.loc.gov/aba/publications/FreeLCC/freelcc.html
- LC/PCC Cutter Table guidance:
  https://www.loc.gov/aba/pcc/053/table.html
- Library of Congress Classification workshop materials:
  https://www.loc.gov/catworkshop/courses/fundamentalslcc/pdf/classify-instr-manual.pdf

## Development

Open `index.html` directly in a browser, or serve the folder with any static
server.

The browser game is static: HTML, CSS, and vanilla JavaScript only.

Run the logic regression tests with:

```sh
node tests/game-logic.test.js
```

## Scoreboard And Email

The frontend posts to the same Apps Script web app used by the SBU training
scoreboard. Payload fields match the existing 4-module scoreboard contract:

- 4 modules
- 15 quiz questions per module
- 1 final sorting point
- Maximum score: 61
- `@stonybrook.edu` email required

`Code.gs` and `apps-script/Code.gs` are included as backend reference copies.
The live deployed endpoint is separate from this repository.
