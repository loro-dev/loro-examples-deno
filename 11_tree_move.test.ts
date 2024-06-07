import { Change, Loro, LoroList, LoroText } from "npm:loro-crdt@0.16.4-alpha.0";
import { expect } from "npm:expect@29.7.0";

Deno.test("Tree move", () => {
  const docA = new Loro();

  const treeA = docA.getTree("tree");
  const node0 = treeA.createNode()
  const node1 = treeA.createNode(node0.id, 0);
  const node2 = treeA.createNode(node0.id, 1);
  node2.moveBefore(node1);
  expect(node2.index()).toBe(0);
  expect(node1.index()).toBe(1);
});

