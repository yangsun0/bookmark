import { action, computed, observable, runInAction } from "mobx";
import type { DropDownOption } from "../Form/Control/Dropdown";
import BookmarkBody from "../Service/Data/BookmarkBody";
import GroupBody from "../Service/Data/GroupBody";
import AppStore from "./AppStore";
import Bookmark from "./Bookmark";
import { formToStore, storeToBody, storeToForm } from "./dataTransfer";
import Group from "./Group";

interface IBookmarkFormValues {
  name: string;
  url: string;
  groupId: string;
  order: string;
}

class BookmarkFormValues implements IBookmarkFormValues {
  name: string;
  url: string;
  groupId: string;
  order: string;
}

class BookmarkFormStore {
  appStore: AppStore;
  bookmarkId: string = "";
  bookmark: Bookmark = new Bookmark();
  groupId: string = "";
  defaultGroup: Group = new Group();
  shouldCreateDefaultGroup: boolean = false;

  @observable orderOptionsCount: number = 1;

  @computed get orderOptions(): Array<DropDownOption> {
    const options = [];
    for (let i = 1; i <= this.orderOptionsCount; i++) {
      options.push({
        label: i.toString(),
        value: i.toString(),
      });
    }
    return options;
  }

  toBookmarkFormValues(): IBookmarkFormValues {
    const values = new BookmarkFormValues();
    storeToForm(this.bookmark, values);
    return values;
  }

  toGroupOptions(): Array<DropDownOption> {
    let options;
    if (this.shouldCreateDefaultGroup) {
      options = [
        { label: this.defaultGroup.name, value: this.defaultGroup.id },
      ];
    } else {
      options = this.appStore.groups
        .slice()
        .sort(Group.compareByOrder)
        .map((group) => {
          return { label: group.name, value: group.id };
        });
    }

    return options;
  }

  shouldResetOrder(orderString: string) {
    const order = parseInt(orderString);
    return order > this.orderOptionsCount;
  }

  @action init(id?: string) {
    this.bookmarkId = id ? id : "";
    if (this.bookmarkId) {
      this.bookmark = this.appStore.findBookmark(this.bookmarkId);
    } else {
      this.createBookmark();
    }

    this.groupId = this.bookmark.groupId;
    this.calculateOrderOptionCount();
  }

  @action createBookmark() {
    this.bookmark = new Bookmark();
    let group;
    if (this.appStore.groups.length === 0) {
      this.createDefaultGroup();
      group = this.defaultGroup;
    } else if (this.appStore.leftGroups.length > 0) {
      group = this.appStore.leftGroups[0];
    } else {
      group = this.appStore.rightGroups[0];
    }

    this.bookmark.groupId = group.id;
    this.bookmark.order = group.bookmarks.length + 1;
    this.bookmark.store = this.appStore;
  }

  @action changeGroup(groupId: string) {
    if (groupId === this.groupId) {
      return;
    }

    this.groupId = groupId;
    this.calculateOrderOptionCount();
  }

  @action calculateOrderOptionCount() {
    if (this.shouldCreateDefaultGroup) {
      this.orderOptionsCount = 1;
      return;
    }

    const group = this.appStore.findGroup(this.groupId);
    let count = group.bookmarks.length;
    if (this.groupId !== this.bookmark.groupId || !this.bookmarkId) {
      count += 1;
    }

    this.orderOptionsCount = count;
  }

  @action createDefaultGroup() {
    this.defaultGroup = new Group();
    this.defaultGroup.id = "PENDING";
    this.defaultGroup.name = "Default";
    this.defaultGroup.store = this.appStore;
    this.shouldCreateDefaultGroup = true;
  }

  @action async saveDefaultGroup() {
    const groupBody = new GroupBody();
    storeToBody(this.defaultGroup, groupBody);
    const newGroup = await this.appStore.bookmarkService.new(groupBody);
    runInAction(() => {
      this.defaultGroup.id = newGroup.id;
    });
  }

  @action async save(bookmarkFormValues: IBookmarkFormValues) {
    formToStore(bookmarkFormValues, this.bookmark);
    if (this.bookmarkId) {
      await this.updateBookmark();
    } else {
      await this.newBookmark();
    }
  }

  @action async newBookmark() {
    if (this.shouldCreateDefaultGroup) {
      await this.saveDefaultGroup();
      runInAction(() => {
        this.bookmark.groupId = this.defaultGroup.id;
      });
    }

    const bookmarkBody = new BookmarkBody();
    storeToBody(this.bookmark, bookmarkBody);
    const newBookmark = await this.appStore.bookmarkService.new(bookmarkBody);
    runInAction(() => {
      this.bookmark.id = newBookmark.id.toString();
      this.appStore.bookmarks.push(this.bookmark);
      if (this.shouldCreateDefaultGroup) {
        this.appStore.groups.push(this.defaultGroup);
      }
    });
  }

  async updateBookmark() {
    const bookmarkBody = new BookmarkBody();
    storeToBody(this.bookmark, bookmarkBody);
    await this.appStore.bookmarkService.update(this.bookmarkId, bookmarkBody);
  }
}

export default BookmarkFormStore;
export type { IBookmarkFormValues };
