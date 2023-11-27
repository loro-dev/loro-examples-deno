import { Loro } from "npm:loro-crdt@0.5.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("Time Travel", () => {
  /**
   * Time travel example of Loro 
   */
  const doc = new Loro();
  doc.setPeerId(0n);
  const text = doc.getText("text");
  text.insert(0, "Hello");
  doc.commit();
  text.insert(5, " world");
  expect(doc.toJson()).toStrictEqual({
    text: "Hello world"
  });

  // Every unicode char insertion is a single operation for Text container
  doc.checkout([{ peer: 0n, counter: 0 }]);
  expect(doc.toJson()).toStrictEqual({
    text: "H"
  });

  doc.checkout([{ peer: 0n, counter: 4 }]);
  expect(doc.toJson()).toStrictEqual({
    text: "Hello"
  });

  // Returns to the latest version
  doc.attach();
  expect(doc.toJson()).toStrictEqual({
    text: "Hello world"
  });
})
