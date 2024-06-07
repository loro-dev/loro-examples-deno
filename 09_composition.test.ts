import { Loro, LoroList, LoroText } from "npm:loro-crdt@0.16.4-alpha.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("Composition", async () => {
  const doc = new Loro();
  const map = doc.getMap("map");
  let callTimes = 0;
  map.subscribe((_event) => {
    callTimes++;
  });

  // Create a sub container for map
  // { map: { list: [] } }
  const list = map.setContainer("list", new LoroList());
  list.push(0);
  list.push(1);

  // Create a sub container for list
  // { map: { list: [0, 1, LoroText] } }
  const text = list.insertContainer(2, new LoroText());
  expect(doc.toJSON()).toStrictEqual({ map: { list: [0, 1, ""] } });
  {
    // Commit will trigger the event, because list is a sub container of map
    doc.commit();
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(callTimes).toBe(1);
  }

  text.insert(0, "Hello, ");
  text.insert(7, "World!");
  expect(doc.toJSON()).toStrictEqual({ map: { list: [0, 1, "Hello, World!"] } });
  {
    // Commit will trigger the event, because text is a descendant of map
    doc.commit();
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(callTimes).toBe(2);
  }
});

