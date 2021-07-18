/** Link in a chain */
class Link<K extends object, V> {
  children = new WeakMap<K, Link<K, V>>();
  declare value: V | undefined;
}

class KeySize extends Error {
  message = 'Keys must include at least one member';
}

/** Maps from a list of objects (referentially) to any value
 *
 * If *any* members of the list get claned up, so does that key/value pair get removed.
 */
export default class WeakListMap<K extends object, V> {
  readonly first = new WeakMap<K, Link<K, V>>();

  delete(key: K[]): boolean {
    const link = this.traverse(key);
    delete link?.value;
    return !!link;
  }

  get(key: K[]): V | undefined {
    const link = this.traverse(key);
    return link?.value;
  }

  has(key: K[]): boolean {
    const link = this.traverse(key);
    if (!link) return false;
    return Object.prototype.hasOwnProperty.call(link, 'value');
  }

  set(key: K[], value: V): WeakListMap<K, V> {
    console.log('setting', key, value);
    if (key.length < 1) throw new KeySize();
    let cur = this.first;
    let link: Link<K, V>;
    for (let i = 0; i < key.length; i++) {
      if (!cur.has(key[i])) {
        link = new Link<K, V>();
        cur.set(key[i], link);
      } else {
        link = cur.get(key[i]) as Link<K, V>;
      }
      cur = link.children;
      // do on later iteration of loop. this makes typescript happy rather than putting after loop
      if (i === key.length - 1) {
        link.value = value;
      }
    }
    return this;
  }

  protected traverse(key: K[]): Link<K, V> | undefined {
    let cur = this.first;
    let link: Link<K, V> | undefined;
    console.log('traverse:', key);
    for (let i = 0; i < key.length; i++) {
      link = cur.get(key[i]);
      console.log(link ? 'found' : 'not found', key[i]);
      if (!link) return;
      cur = link.children;
    }
    return link;
  }
}
