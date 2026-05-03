import {reactive} from "vue";

export const bridgeStore = reactive({
  events: [],

  addEvent(event) {
    this.events.unshift({
      id: event.id || Date.now(),
      time: new Date().toLocaleTimeString(),
      ...event,
    });

    if (this.events.length > 100) {
      this.events.pop();
    }
  },
});
