import {reactive} from "vue";

export const bridgeStore = reactive({
  groups: {}, // requestId 기준

  addEvent(event) {
    const {id} = event;

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
  },

  get groupList() {
    return Object.values(this.groups).sort((a, b) => b.createdAt - a.createdAt);
  },
});
