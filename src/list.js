import { ListTypeNo } from './enums.js';

// Collection of lists
export class Lists {
  /** @type {List[]} */
  lists = [];

  /**
   * Create new instance with lists
   *
   * @param {List[]} lists
   */
  constructor(lists = []) {
    this.lists = lists;
  }

  /**
   * Add list to collection
   *
   * @param {List} list
   */
  add(list) {
    this.lists.push(list);
  }

  /**
   * Delete list from collection and via API
   *
   * @param {List} list
   */
  async delete(list) {
    const removeListID = list.ID;

    await list.delete();

    this.lists = this.lists.filter((list) => list.ID !== removeListID);
  }

  /**
   * Create new list via API and add to collection, optionally with the first item and comment
   *
   * @param {AIPRMClient} client
   * @param {ListTypeNo} type
   * @param {string} comment
   * @param {import('./client').FirstListItem} firstItem
   * @returns {Promise<List>}
   */
  async create(client, type, comment = '', firstItem = {}) {
    const list = await List.create(client, type, comment, firstItem);

    this.add(list);

    return list;
  }

  /**
   * Get "Favorites" list
   *
   * @returns {List|undefined}
   */
  getFavorites() {
    return this.withType(ListTypeNo.FAVORITES);
  }

  /**
   * Get "Hidden" list
   *
   * @returns {List|undefined}
   */
  getHidden() {
    return this.withType(ListTypeNo.HIDDEN);
  }

  /**
   * Get "Custom" lists
   *
   * @returns {List[]}
   */
  getCustom() {
    return this.lists.filter((list) => list.is(ListTypeNo.CUSTOM));
  }

  /**
   * Get "AIPRM Verified" list
   *
   * @returns {List|undefined}
   */
  getAIPRMVerified() {
    return this.withType(ListTypeNo.AIPRM_VERIFIED);
  }

  /**
   * Get list by ID
   *
   * @returns {List|undefined}
   */
  withID(listID) {
    return this.lists.find((list) => list.list.ID === listID);
  }

  /**
   * Get list by type
   *
   * @param {ListTypeNo} type
   * @returns {List|undefined}
   */
  withType(type) {
    return this.lists.find((list) => list.is(type));
  }

  /**
   * Get list by ID and type
   *
   * @returns {List|undefined}
   */
  withIDAndType(listID, type) {
    return this.lists.find((list) => list.list.ID === listID && list.is(type));
  }
}

// Single list
export class List {
  /** @type {import("./client").AIPRMClient} */
  client;

  /** @type {import("./client").List} */
  list;

  /**
   * Create new instance with list and API client
   *
   * @param {import("./client").AIPRMClient} client
   * @param {import("./client").List} list
   */
  constructor(client, list) {
    this.client = client;
    this.list = list;
  }

  // get list ID
  get ID() {
    return this.list.ID;
  }

  // get list comment
  get Comment() {
    return this.list.Comment;
  }

  // get list items
  get Items() {
    return this.list.Items;
  }

  // get OwnList flag
  get OwnList() {
    return this.list.OwnList;
  }

  /**
   * Update list comment via API and update local list
   *
   * @param {List['Comment']} comment
   */
  async update(comment) {
    this.list.Comment = comment;

    await this.client.updateList(this.list);
  }

  // Delete list via API
  async delete() {
    await this.client.deleteList(this.list.ID);
  }

  /**
   * Add prompt to list via API and update local list
   *
   * @param {import("./inject").Prompt} prompt
   */
  async add(prompt) {
    const item = await this.client.addToList(this.list.ID, prompt.ID);

    this.list.Items.push(item);
  }

  /**
   * Remove prompt from list via API and update local list
   *
   * @param {import("./inject").Prompt} prompt
   */
  async remove(prompt) {
    await this.client.removeFromList(this.list.ID, prompt.ID);

    this.list.Items = this.list.Items.filter(
      (item) => item.PromptID !== prompt.ID
    );
  }

  /**
   * Check if list contains prompt
   *
   * @param {import("./inject").Prompt} prompt
   * @returns {Promise<boolean>}
   */
  async has(prompt) {
    if (this.list.Items === undefined) {
      await this.getListDetails();
    }

    return this.list.Items.some((item) => item.PromptID === prompt.ID);
  }

  /**
   * Create new list via API and return new instance, optionally with the first item and comment
   *
   * @param {import("./client").AIPRMClient} client
   * @param {ListTypeNo} type
   * @param {string} comment
   * @param {import('./client').FirstListItem} firstItem
   * @returns {Promise<List>}
   */
  static async create(client, type, comment = '', firstItem = {}) {
    return new List(client, await client.createList(type, comment, firstItem));
  }

  // Get list details via API and update local list, if list items are not already loaded
  async getListDetails() {
    if (this.list.Items === undefined) {
      this.list = await this.client.getListDetails(this.list.ID);
    }
  }

  /**
   * Get all prompt IDs in list
   *
   * @returns {Promise<import("./inject").Prompt['ID']>}
   */
  async getPromptIDS() {
    if (this.list.Items === undefined) {
      await this.getListDetails();
    }

    return this.list.Items.map((item) => item.PromptID);
  }

  /**
   * Check if list is of type
   *
   * @param {ListTypeNo} type
   * @returns {boolean}
   */
  is(type) {
    return this.list.ListTypeNo === type;
  }
}
