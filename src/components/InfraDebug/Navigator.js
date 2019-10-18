export default class Node{
  constructor(data, depth, parent){
    this._depth = depth;
    this._ask = data.id;
    this._title = data.friendly;
    this.parent = parent;
    this.outcome = null;
  }

  depth() { return this._depth; }
  title() { return this._title; }
  isLeaf() { return !this.positive && !this.negative; }
  isRoot() { return !this.parent; }
  wasProcessed(){ return !!this.outcome; }
  isCurrent(current){ return this == current; }

  static gulp(rawNode, parent=null, i=0){
    if(!rawNode) return null;

    const node = new Node(rawNode, i, parent);
    node.positive = this.gulp(rawNode.positive, i + 1, node);
    node.negative = this.gulp(rawNode.negative, i + 1, node);
    return node;
  }
}