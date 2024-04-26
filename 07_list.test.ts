import { Loro, LoroList, LoroMovableList, LoroText } from "npm:loro-crdt@0.15.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("List", () => {
  let list = new LoroList();
  list.push(0);
  list.push("1");
  const doc = new Loro();
  const map = doc.getMap("root");
  list = map.setContainer("list", list);
  expect(doc.toJson()).toStrictEqual({ root: { list: [0, "1"] } });
  list.delete(0, 1);
  expect(doc.toJson()).toStrictEqual({ root: { list: ["1"] } });
})

Deno.test("MovableList", () => {
  let list = new LoroMovableList();
  list.push(0);
  list.push("1");
  const doc = new Loro();
  const map = doc.getMap("root");
  list = map.setContainer("list", list);
  expect(doc.toJson()).toStrictEqual({ root: { list: [0, "1"] } });
  list.move(0, 1);
  expect(doc.toJson()).toStrictEqual({ root: { list: ["1", 0] } });
  // Uint8Array is a special type in Loro
  list.set(1, new Uint8Array([1, 2, 3]));
  expect(doc.toJson()).toStrictEqual({ root: { list: ["1", new Uint8Array([1, 2, 3])] } });
  const text = list.setContainer(0, new LoroText());
  text.insert(0, "Hello")
  expect(doc.toJson()).toStrictEqual({ root: { list: ["Hello", new Uint8Array([1, 2, 3])] } });
})

