import { Change, Loro, LoroList, LoroText } from "npm:loro-crdt@0.16.4-alpha.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("op and change", () => {
  const docA = new Loro();
  docA.setPeerId("0");
  const textA = docA.getText("text");
  // This create 3 operations
  textA.insert(0, "123");
  // This create a new Change
  docA.commit();
  // This create 2 operations
  textA.insert(0, "ab");
  // This will NOT create a new Change
  docA.commit();

  {
    const changeMap: Map<`${number}`, Change[]> = docA.getAllChanges();
    expect(changeMap.size).toBe(1);
    expect(changeMap.get("0")).toStrictEqual([
      {
        lamport: 0,
        length: 5,
        peer: "0",
        counter: 0,
        deps: [],
        timestamp: 0,
      },
    ]);
  }

  // Create docB from doc
  const docB = Loro.fromSnapshot(docA.exportSnapshot());
  docB.setPeerId("1");
  const textB = docB.getText("text");
  // This create 2 operations
  textB.insert(0, "cd");

  // Import the Change from docB to doc
  const bytes = docB.exportFrom(); // Exporting has implicit commit
  docA.import(bytes);

  // This create 1 operations
  textA.insert(0, "1");
  // Because doc import a Change from docB, it will create a new Change for
  // new commit to record this causal order
  docA.commit();
  {
    const changeMap: Map<`${number}`, Change[]> = docA.getAllChanges();
    expect(changeMap.size).toBe(2);
    expect(changeMap.get("0")).toStrictEqual([
      {
        lamport: 0,
        length: 5,
        peer: "0",
        counter: 0,
        deps: [],
        timestamp: 0,
      },
      {
        lamport: 7,
        length: 1,
        peer: "0",
        counter: 5,
        deps: [{ peer: "1", counter: 1 }],
        timestamp: 0,
      },
    ]);
    expect(changeMap.get("1")).toStrictEqual([
      {
        lamport: 5,
        length: 2,
        peer: "1",
        counter: 0,
        deps: [{ peer: "0", counter: 4 }],
        timestamp: 0,
      },
    ]);
  }
});
