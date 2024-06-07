import { Loro, LoroText } from "npm:loro-crdt@0.16.4-alpha.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("LoroMap", () => {
  const docA = new Loro();
  docA.setPeerId("0");
  const docB = new Loro();
  docB.setPeerId("1");

  const mapA = docA.getMap("map");
  const mapB = docB.getMap("map");

  mapA.set("a", 1);
  const textB = mapB.setContainer("a", new LoroText());
  textB.insert(0, "Hi");

  expect(docA.toJSON()).toStrictEqual({ map: { a: 1 } });
  expect(docB.toJSON()).toStrictEqual({ map: { a: "Hi" } });

  docA.import(docB.exportSnapshot());
  docB.import(docA.exportSnapshot());

  expect(docA.toJSON()).toStrictEqual({ map: { a: "Hi" } });
  expect(docB.toJSON()).toStrictEqual({ map: { a: "Hi" } });
});

