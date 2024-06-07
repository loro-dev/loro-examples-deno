import { Loro } from "npm:loro-crdt@0.16.4-alpha.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("Save and load", () => {
  // To save the document, you can call `doc.exportSnapshot()` to get the binary data of the whole document.
  // When you want to load the document, you can call `doc.import(data)` to load the binary data.
  const doc = new Loro();
  doc.getText("text").insert(0, "Hello world!");
  const data = doc.exportSnapshot();

  const newDoc = new Loro();
  newDoc.import(data);
  expect(newDoc.toJSON()).toStrictEqual({
    text: "Hello world!"
  });
})


Deno.test("Save and load incrementally", () => {
  // It's costly to export the whole document on every keypress.
  // So you can call `doc.exportFrom()` to get the binary data of the operations since last export.
  const doc = new Loro();
  doc.getText("text").insert(0, "Hello world!");
  const data = doc.exportSnapshot();
  let lastSavedVersion = doc.version();
  doc.getText("text").insert(0, "✨");
  const update0 = doc.exportFrom(lastSavedVersion);
  lastSavedVersion = doc.version();
  doc.getText("text").insert(0, "😶‍🌫️");
  const update1 = doc.exportFrom(lastSavedVersion);

  {
    /**
     * You can import the snapshot and the updates to get the latest version of the document.
     */

    // import the snapshot
    const newDoc = new Loro();
    newDoc.import(data);
    expect(newDoc.toJSON()).toStrictEqual({
      text: "Hello world!"
    });

    // import update0
    newDoc.import(update0)
    expect(newDoc.toJSON()).toStrictEqual({
      text: "✨Hello world!"
    });

    // import update1
    newDoc.import(update1)
    expect(newDoc.toJSON()).toStrictEqual({
      text: "😶‍🌫️✨Hello world!"
    });
  }

  {
    /**
     * You may also import them in a batch
     */
    const newDoc = new Loro();
    newDoc.importUpdateBatch([update1, update0, data])
    expect(newDoc.toJSON()).toStrictEqual({
      text: "😶‍🌫️✨Hello world!"
    });
  }
})
