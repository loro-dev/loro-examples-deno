import { expect } from "npm:expect@29.7.0";
import { LoroDoc } from "npm:loro-crdt@1.0.8";

Deno.test("Time Travel", () => {
  /**
   * Time travel example of Loro
   */
  const doc = new LoroDoc();
  doc.setPeerId(0n);
  const text = doc.getText("text");
  text.insert(0, "Hello");
  doc.commit();
  text.insert(5, " world");
  expect(doc.toJSON()).toStrictEqual({
    text: "Hello world",
  });

  // Every unicode char insertion is a single operation for Text container
  doc.checkout([{ peer: "0", counter: 0 }]);
  expect(doc.toJSON()).toStrictEqual({
    text: "H",
  });

  doc.checkout([{ peer: "0", counter: 4 }]);
  expect(doc.toJSON()).toStrictEqual({
    text: "Hello",
  });

  // Returns to the latest version
  doc.attach();
  expect(doc.toJSON()).toStrictEqual({
    text: "Hello world",
  });
});
