import {shallowMount} from "@vue/test-utils";
import MessageToggle from "@/components/Jest/MessageToggle.vue";
import Message from "@/components/Jest/Message.vue";

describe("MessageToggle.vue", () => {
  it("toggles msg passed to Message when button is clicked", async () => {
    const wrapper = shallowMount(MessageToggle);
    const button = wrapper.find("#toggle-message");
    button.trigger("click");

    const MessageComponent = await wrapper.findComponent(Message);
    expect(MessageComponent.props()).toEqual({msg: "message"});

    await button.trigger("click");
    expect(MessageComponent.props()).toEqual({msg: "toggled message"});
  });
});
