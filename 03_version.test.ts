import { Loro, OpId } from "npm:loro-crdt@0.15.0";
import { expect } from "npm:expect@29.7.0";


Deno.test("Frontiers & Version Vector Conversion", () => {
  const doc0 = new Loro();
  doc0.setPeerId(0n);
  doc0.getText("text").insert(0, "1");
  doc0.commit();
  const doc1 = new Loro();
  doc1.setPeerId(1n);
  doc1.getText("text").insert(0, "1");
  doc1.commit();
  doc1.import(doc0.exportFrom());
  doc1.getText("text").insert(0, "1");
  doc1.commit();

  const frontiers = doc1.frontiers();
  expect(frontiers).toStrictEqual([{ peer: "1", counter: 1 } as OpId])
  const vv = doc1.frontiersToVV(frontiers);
  expect(vv.toJSON()).toStrictEqual(new Map([["0", 1], ["1", 2]]))
  expect(doc1.vvToFrontiers(vv)).toStrictEqual(frontiers);
})
