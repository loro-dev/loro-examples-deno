import { Delta, Loro } from "npm:loro-crdt@0.5.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("Text", () => {
  /**
   * Loro supports text manipulation.
   */
  const doc = new Loro();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.delete(0, 6);
  expect(text.toString()).toBe("world!");
});

Deno.test("Rich text", () => {
  /**
   * Loro supports rich text CRDTs
   */
  const doc = new Loro();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5 }, "bold", true);
  expect(text.toDelta()).toStrictEqual([{
    insert: "Hello",
    attributes: { bold: true },
  }, {
    insert: " world!",
  }] as Delta<string>[]);
});

Deno.test("Rich text custom expand behavior - Bold", () => {
  /**
   * For different styles on rich text, you may want different expand behavior 
   * when users inserting new text at the boundary of the style.
   * 
   * - Bold: expand the style to cover the new text inserted after the boundary.
   * - Link: will not expand the style when inserting new text at the boundary.
   */
  const doc = new Loro();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5, expand: "after" }, "bold", true);
  text.insert(5, "!");
  expect(text.toDelta()).toStrictEqual([{
    insert: "Hello!",
    attributes: { bold: true },
  }, {
    insert: " world!",
  }] as Delta<string>[]);
})


Deno.test("Rich text custom expand behavior - Link", () => {
  /**
   * For different styles on rich text, you may want different expand behavior 
   * when users inserting new text at the boundary of the style.
   * 
   * - Bold: expand the style to cover the new text inserted after the boundary.
   * - Link: will not expand the style when inserting new text at the boundary.
   */
  const doc = new Loro();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  text.mark({ start: 0, end: 5, expand: "none" }, "link", true);
  text.insert(5, "!");
  expect(text.toDelta()).toStrictEqual([{
    insert: "Hello",
    attributes: { link: true },
  }, {
    insert: "! world!",
  }] as Delta<string>[]);
})

Deno.test("Rich text event", () => {
  /**
   * Loro text will receive rich text event in Quill Delta format
   */
  const doc = new Loro();
  const text = doc.getText("text");
  text.insert(0, "Hello world!");
  doc.commit();
  let ran = false;
  text.subscribe(doc, (event) => {
    if (event.diff.type === "text") {
      expect(event.diff.diff).toStrictEqual([{
        retain: 5,
        attributes: { bold: true }
      }]);
      ran = true;
    }
  });
  text.mark({ start: 0, end: 5 }, "bold", true);
  doc.commit();
  expect(ran).toBeTruthy();
});
