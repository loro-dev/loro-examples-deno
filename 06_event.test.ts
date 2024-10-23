import {
  getType,
  LoroDoc,
  LoroMap,
  LoroText,
} from "npm:loro-crdt@1.0.0-beta.5";
import { expect } from "npm:expect@29.7.0";

Deno.test("Event have delta that contains Container", async () => {
  const doc = new LoroDoc();
  const list = doc.getList("list");
  let ran = false;
  doc.subscribe((events) => {
    for (const event of events.events) {
      if (event.diff.type === "list") {
        for (const item of event.diff.diff) {
          expect(item.insert?.length).toBe(2);
          expect(getType(item.insert![0])).toBe("Text");
          expect(getType(item.insert![1])).toBe("Map");
          const t = item.insert![0] as LoroText;
          expect(t.toString()).toBe("Hello");
        }
        ran = true;
      }
    }
  });

  list.insertContainer(0, new LoroMap());
  const t = list.insertContainer(0, new LoroText());
  t.insert(0, "He");
  t.insert(2, "llo");
  doc.commit();
  await new Promise((resolve) => setTimeout(resolve, 1));
  expect(ran).toBeTruthy();
});
