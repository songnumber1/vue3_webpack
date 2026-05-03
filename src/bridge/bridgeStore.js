import {reactive} from "vue";
import {BRIDGE_MAX_GROUPS} from "./bridgeConstants";

export const bridgeStore = reactive({
  groups: {},

  addEvent(event) {
    const {id} = event;

    if (!id) return;

    if (!this.groups[id]) {
      this.groups[id] = {
        id,
        type: event.type,
        createdAt: new Date(),
        open: true,
        events: [],
      };
    }

    this.groups[id].events.push({
      ...event,
      time: new Date(),
    });

    this.limitGroups();
  },

  limitGroups(max = BRIDGE_MAX_GROUPS) {
    const list = this.groupList;

    if (list.length <= max) return;

    list.slice(max).forEach((group) => {
      delete this.groups[group.id];
    });
  },

  clear() {
    this.groups = {};
  },

  get groupList() {
    return Object.values(this.groups).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },
});
