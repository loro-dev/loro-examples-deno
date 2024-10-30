import { LoroDoc, OpId } from "npm:loro-crdt@1.0.8";
import { expect } from "npm:expect@29.7.0";

Deno.test("Frontiers & Version Vector Conversion", () => {
  const doc0 = new LoroDoc();
  doc0.setPeerId(0n);
  doc0.getText("text").insert(0, "1");
  doc0.commit();
  const doc1 = new LoroDoc();
  doc1.setPeerId(1n);
  doc1.getText("text").insert(0, "1");
  doc1.commit();
  doc1.import(doc0.export({ mode: "update" }));
  doc1.getText("text").insert(0, "1");
  doc1.commit();

  const frontiers = doc1.frontiers();
  expect(frontiers).toStrictEqual([{ peer: "1", counter: 1 } as OpId]);
  const vv = doc1.frontiersToVV(frontiers);
  expect(vv.toJSON()).toStrictEqual(
    new Map([
      ["0", 1],
      ["1", 2],
    ]),
  );
  expect(doc1.vvToFrontiers(vv)).toStrictEqual(frontiers);
});

Deno.test("Event", () => {
  const doc1 = new LoroDoc();
  doc1.setPeerId(1);
  const doc2 = new LoroDoc();
  doc2.setPeerId(2);

  // Some ops on doc1 and doc2
  doc1.getText("text").insert(0, "Alice");
  doc2.getText("text").insert(0, "Hello, Loro!");
  console.log(doc2.version().toJSON()); // Map(0) {}
  const updates = doc1.export({ mode: "update" });
  doc2.import(updates); // This first commits any pending operations in doc2
  console.log(doc2.version().toJSON()); // Map(2) { "1" => 5, "2" => 12 }
});
