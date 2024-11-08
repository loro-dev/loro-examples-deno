import { LoroDoc } from "npm:loro-crdt@1.0.8";
import { expect } from "npm:expect@29.7.0";

Deno.test("Shallow snapshot", () => {
    const rootDoc = new LoroDoc();
    rootDoc.setPeerId("0");
    rootDoc.getText("text").insert(0, "Hello world!");
    const snapshot = rootDoc.export({
        mode: "shallow-snapshot",
        frontiers: [{ peer: "0", counter: 5 }],
    });

    const shallowDoc = new LoroDoc();
    shallowDoc.import(snapshot);
    expect(shallowDoc.getText("text").toString()).toBe("Hello world!");
    expect(shallowDoc.isShallow()).toBe(true);
});

Deno.test("Shallow snapshot - should throw if there is old update before the shallow root", () => {
    const rootDoc = new LoroDoc();
    rootDoc.setPeerId("0");
    rootDoc.getText("text").insert(0, "He");
    const oldDoc = new LoroDoc();
    oldDoc.import(rootDoc.export({ mode: "update" }));

    rootDoc.getText("text").insert(2, "llo world!");
    const snapshot = rootDoc.export({
        mode: "shallow-snapshot",
        frontiers: [{ peer: "0", counter: 5 }],
    });

    //
    //                         Shallow Snapshot
    //                      ╔ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ╗
    //
    // ┌────┐     ┌─────┐   ║ ┌─────────┐         ║
    // │ He │◀─┬──│ llo │◀────│  world! │
    // └────┘  │  └─────┘   ║ └─────────┘         ║
    //         │
    //         │   ┌────┐   ║                     ║
    //         └───│ e! │
    //             └────┘   ╚ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ╝
    //              old
    //             update
    //
    oldDoc.getText("text").insert(0, "e!");
    const shallowDoc = new LoroDoc();
    shallowDoc.import(snapshot);
    const update = oldDoc.export({ mode: "update", from: rootDoc.version() });
    expect(() => shallowDoc.import(update))
        .toThrow();
});
