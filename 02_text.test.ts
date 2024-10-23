import { Delta, LoroDoc } from "npm:loro-crdt@1.0.0-beta.5";
import { expect } from "npm:expect@29.7.0";

Deno.test("Long text", () => {
  /**
   * Loro supports text manipulation.
   */
  const doc = new LoroDoc();
  const text = doc.getText("text");
  for (let i = 0; i < 1_000_000; i += 1) {
    text.insert(i, i.toString());
  }
  doc.export({ mode: "update" });
  doc.export({ mode: "snapshot" });
});

Deno.test("Text", () => {
  /**
   * Loro supports text manipulation.
   */
  const doc = new LoroDoc();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.delete(0, 6);
  expect(text.toString()).toBe("world!");
});

Deno.test("Rich text", () => {
  /**
   * Loro supports rich text CRDTs
   */
  const doc = new LoroDoc();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5 }, "bold", true);
  expect(text.toDelta()).toStrictEqual([
    {
      insert: "Hello",
      attributes: { bold: true },
    },
    {
      insert: " world!",
    },
  ] as Delta<string>[]);
});

Deno.test("Rich text custom expand behavior - Bold", () => {
  /**
   * For different styles on rich text, you may want different expand behavior
   * when users inserting new text at the boundary of the style.
   *
   * - Bold: expand the style to cover the new text inserted after the boundary.
   * - Link: will not expand the style when inserting new text at the boundary.
   */
  const doc = new LoroDoc();
  doc.configTextStyle({ bold: { expand: "after" } });
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5 }, "bold", true);
  text.insert(5, "!");
  expect(text.toDelta()).toStrictEqual([
    {
      insert: "Hello!",
      attributes: { bold: true },
    },
    {
      insert: " world!",
    },
  ] as Delta<string>[]);
});

Deno.test("Rich text custom expand behavior - Link", () => {
  /**
   * For different styles on rich text, you may want different expand behavior
   * when users inserting new text at the boundary of the style.
   *
   * - Bold: expand the style to cover the new text inserted after the boundary.
   * - Link: will not expand the style when inserting new text at the boundary.
   */
  const doc = new LoroDoc();
  doc.configTextStyle({
    link: { expand: "none" },
  });
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5 }, "link", true);
  text.insert(5, "!");
  expect(text.toDelta()).toStrictEqual([
    {
      insert: "Hello",
      attributes: { link: true },
    },
    {
      insert: "! world!",
    },
  ] as Delta<string>[]);
});

Deno.test("Rich text event", async () => {
  /**
   * Loro text will receive rich text event in Quill Delta format
   */
  const doc = new LoroDoc();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  doc.commit();
  let ran = false;
  text.subscribe((events) => {
    for (const event of events.events) {
      if (event.diff.type === "text") {
        expect(event.diff.diff).toStrictEqual([
          {
            retain: 5,
            attributes: { bold: true },
          },
        ]);
        ran = true;
      }
    }
  });
  text.mark({ start: 0, end: 5 }, "bold", true);
  doc.commit();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ran).toBeTruthy();
});
