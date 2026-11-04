#!/usr/bin/env node
// `npm run coffee`. RFC 2324, section 2.3.2.
console.error(`
       ( (
        ) )
     .______.
     |      |]    418 I'm a teapot
     \\      /     This repo brews websites, not coffee.
      \`----'      Try: npm run dev
`);
process.exitCode = 18; // 418 % 400: exit codes stop at 255
