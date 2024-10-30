import { Cursor, LoroDoc } from "npm:loro-crdt@1.0.8";
import { expect } from "npm:expect@29.7.0";

Deno.test("List", () => {
  const docA = new LoroDoc();
  docA.setPeerId("1");
  const listA = docA.getList("list");
  listA.push(0);
  listA.push(1);
  listA.push(2);
  const bytes: Uint8Array = docA.export({ mode: "snapshot" });

  const docB = LoroDoc.fromSnapshot(bytes);
  docB.setPeerId("2");
  const listB = docB.getList("list");
  {
    // Concurrently docA and docB update element at index 2
    // docA updates it to 8
    // docB updates it to 9
    // docA.toJSON() should return { list: [0, 1, 8] }
    // docB.toJSON() should return { list: [0, 1, 9] }

    listB.delete(2, 1);
    listB.insert(2, 9);
    expect(docB.toJSON()).toStrictEqual({ list: [0, 1, 9] });
    listA.delete(2, 1);
    listA.insert(2, 8);
    expect(docA.toJSON()).toStrictEqual({ list: [0, 1, 8] });
  }

  {
    // Merge docA and docB
    docA.import(docB.export({ mode: "update", from: docA.version() }));
    docB.import(docA.export({ mode: "update", from: docB.version() }));
  }

  expect(docA.toJSON()).toStrictEqual({ list: [0, 1, 8, 9] });
  expect(docB.toJSON()).toStrictEqual({ list: [0, 1, 8, 9] });
});

Deno.test("MovableList", () => {
  const docA = new LoroDoc();
  docA.setPeerId("1");
  const listA = docA.getMovableList("list");
  listA.push(0);
  listA.push(1);
  listA.push(2);
  const bytes: Uint8Array = docA.export({ mode: "snapshot" });

  const docB = LoroDoc.fromSnapshot(bytes);
  docB.setPeerId("2");
  const listB = docB.getMovableList("list");
  {
    // Concurrently docA and docB update element at index 2
    // docA updates it to 8
    // docB updates it to 9
    // docA.toJSON() should return { list: [0, 1, 8] }
    // docB.toJSON() should return { list: [0, 1, 9] }

    listA.set(2, 8);
    expect(docA.toJSON()).toStrictEqual({ list: [0, 1, 8] });
    listB.set(2, 9);
    expect(docB.toJSON()).toStrictEqual({ list: [0, 1, 9] });
  }

  {
    // Merge docA and docB
    docA.import(docB.export({ mode: "update", from: docA.version() }));
    docB.import(docA.export({ mode: "update", from: docB.version() }));
  }

  // Converge to [0, 1, 9] because docB has larger peerId thus larger logical time
  expect(docA.toJSON()).toStrictEqual({ list: [0, 1, 9] });
  expect(docB.toJSON()).toStrictEqual({ list: [0, 1, 9] });

  {
    // Concurrently docA and docB move element at index 0
    // docA moves it to 2
    // docB moves it to 1
    // docA.toJSON() should return { list: [1, 9, 0] }
    // docB.toJSON() should return { list: [1, 0, 9] }

    listA.move(0, 2);
    listB.move(0, 1);
    expect(docA.toJSON()).toStrictEqual({ list: [1, 9, 0] });
    expect(docB.toJSON()).toStrictEqual({ list: [1, 0, 9] });
  }

  {
    // Merge docA and docB
    docA.import(docB.export({ mode: "update", from: docA.version() }));
    docB.import(docA.export({ mode: "update", from: docB.version() }));
  }

  // Converge to [1, 0, 9] because docB has larger peerId thus larger logical time
  expect(docA.toJSON()).toStrictEqual({ list: [1, 0, 9] });
  expect(docB.toJSON()).toStrictEqual({ list: [1, 0, 9] });
});

Deno.test("List Cursors", () => {
  const doc = new LoroDoc();
  doc.setPeerId("1");
  const list = doc.getList("list");
  list.push("Hello");
  list.push("World");
  const cursor = list.getCursor(1)!;
  expect(cursor.pos()).toStrictEqual({ peer: "1", counter: 1 });

  const encodedCursor: Uint8Array = cursor.encode();
  const exported: Uint8Array = doc.export({ mode: "snapshot" });

  // Sending the exported snapshot and the encoded cursor to peer 2
  // Peer 2 will decode the cursor and get the position of the cursor in the list
  // Peer 2 will then insert "Hello" at the beginning of the list

  const docB = new LoroDoc();
  docB.setPeerId("2");
  const listB = docB.getList("list");
  docB.import(exported);
  listB.insert(0, "Foo");
  expect(docB.toJSON()).toStrictEqual({ list: ["Foo", "Hello", "World"] });
  const cursorB = Cursor.decode(encodedCursor);
  {
    // The cursor position is shifted to the right by 1
    const pos = docB.getCursorPos(cursorB);
    expect(pos.offset).toBe(2);
  }
  listB.insert(1, "Bar");
  expect(docB.toJSON()).toStrictEqual({
    list: ["Foo", "Bar", "Hello", "World"],
  });
  {
    // The cursor position is shifted to the right by 1
    const pos = docB.getCursorPos(cursorB);
    expect(pos.offset).toBe(3);
  }
  listB.delete(3, 1);
  expect(docB.toJSON()).toStrictEqual({ list: ["Foo", "Bar", "Hello"] });
  {
    // The position cursor points to is now deleted,
    // but it should still get the position
    const pos = docB.getCursorPos(cursorB);
    expect(pos.offset).toBe(3);
    // It will also offer a update on the cursor position.
    //
    // It's because the old cursor position is deleted, `doc.getCursorPos()` will slow down over time.
    // Internally, it needs to traverse the related history to find the correct position for a deleted
    // cursor position.
    //
    // After refreshing the cursor, the performance of `doc.getCursorPos()` will improve.
    expect(pos.update).toBeDefined();
    const newCursor: Cursor = pos.update!;
    // The new cursor position is undefined because the cursor is at the end of the list
    expect(newCursor.pos()).toBeUndefined();
    // The side is 1 because the cursor is at the right end of the list
    expect(newCursor.side()).toBe(1);

    const newPos = docB.getCursorPos(newCursor);
    // The offset doesn't changed
    expect(newPos.offset).toBe(3);
    // The update is undefined because the cursor no longer needs to be updated
    expect(newPos.update).toBeUndefined();
  }
});
