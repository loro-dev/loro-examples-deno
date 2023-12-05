import { Loro } from "npm:loro-crdt@0.6.3"

/**
cpu: Apple M1
runtime: deno 1.38.0 (aarch64-apple-darwin)

file:///Users/zxch3n/Code/loro-deno-examples/benches/text.bench.ts
benchmark                  time (avg)        iter/s             (min … max)       p75       p99      p995
--------------------------------------------------------------------------- -----------------------------
Text                       30.38 ms/iter          32.9   (27.97 ms … 42.13 ms)  30.37 ms  42.13 ms  42.13 ms
Text in raw JS string      102.6 ms/iter           9.7  (96.78 ms … 119.13 ms) 104.68 ms 119.13 ms 119.13 ms
 */

Deno.bench("Text", () => {
  const doc = new Loro();
  const text = doc.getText("text");
  for (let i = 0; i < 30000; i++) {
    text.insert(i, i.toString());
  }
})

Deno.bench("Text in raw JS string", () => {
  let text = "";
  for (let i = 0; i < 30000; i++) {
    text = text.slice(0, i) + i.toString() + text.slice(i);
  }
})
