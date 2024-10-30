import { LoroDoc, LoroList, LoroMap, LoroText } from "npm:loro-crdt@1.0.8";
import { expect } from "npm:expect@29.7.0";

Deno.test("Basic usage", () => {
  /**
   * LoroDoc is the entry point for using Loro.
   * You must create a Doc to use Map, List, Text, and other CRDT types.
   */
  const doc = new LoroDoc();
  const list: LoroList = doc.getList("list");
  list.insert(0, "A");
  list.insert(1, "B");
  list.insert(2, "C"); // ["A", "B", "C"]

  const map: LoroMap = doc.getMap("map");
  // map can only has string key
  map.set("key", "value");
  expect(doc.toJSON()).toStrictEqual({
    list: ["A", "B", "C"],
    map: { key: "value" },
  });

  // delete 2 element at index 0
  list.delete(0, 2);
  expect(doc.toJSON()).toStrictEqual({
    list: ["C"],
    map: { key: "value" },
  });
});

Deno.test("Sub containers", () => {
  /**
   * You can create sub CRDT containers in List and Map.
   */
  const doc = new LoroDoc();
  const list: LoroList = doc.getList("list");
  const map: LoroMap = doc.getMap("list");
  // insert a List container at index 0, and get the handler to that list
  const subList = list.insertContainer(0, new LoroList());
  subList.insert(0, "A");
  expect(list.toJSON()).toStrictEqual([["A"]]);
  // create a Text container inside the Map container
  const subtext = map.setContainer("text", new LoroText());
  subtext.insert(0, "Hi");
  expect(map.toJSON()).toStrictEqual({ text: "Hi" });
});

Deno.test("Sync", () => {
  /**
   * Two documents can complete synchronization with two rounds of exchanges.
   */
  const docA = new LoroDoc();
  const docB = new LoroDoc();
  const listA: LoroList = docA.getList("list");
  listA.insert(0, "A");
  listA.insert(1, "B");
  listA.insert(2, "C");
  // B import the ops from A
  docB.import(docA.export({ mode: "update" }));
  expect(docB.toJSON()).toStrictEqual({
    list: ["A", "B", "C"],
  });

  const listB: LoroList = docB.getList("list");
  // delete 1 element at index 1
  listB.delete(1, 1);
  // A import the missing ops from B
  docA.import(docB.export({ mode: "update", from: docA.version() }));
  // list at A is now ["A", "C"], with the same state as B
  expect(docA.toJSON()).toStrictEqual({
    list: ["A", "C"],
  });
  expect(docA.toJSON()).toStrictEqual(docB.toJSON());
});
