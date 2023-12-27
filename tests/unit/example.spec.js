import {shallowMount} from "@vue/test-utils";
import Jest from "@/components/Jest.vue";

describe("Jest.vue", () => {
  it("renders props.msg when passed", () => {
    const msg = "new message";
    const wrapper = shallowMount(Jest, {
      props: {msg},
    });
    expect(wrapper.text()).toMatch(msg);
  });
});
