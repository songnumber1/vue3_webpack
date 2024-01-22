import {shallowMount, mount} from "@vue/test-utils";
import {nextTick} from "vue";
import MountedTest from "@/components/Jest/MountedTest.vue";

describe("MountedTest.vue", () => {
  it("MountedTest 컴포턴트 Mounted", () => {
    const wrapper = shallowMount(MountedTest);

    expect(wrapper.find("span").exists()).toBe(false);
    expect(wrapper.find("p").exists()).toBe(true);
    // expect(wrapper.find("p").text()).toBe("1234");

    const firstText = wrapper.find("#first").text();
    expect(firstText).toEqual("1234");

    const secondText = wrapper.find(".second").text();
    expect(secondText).toEqual("4321");
  });

  it("MountedTest 컴포턴트 Custom Mounted", async () => {
    const wrapper = mount(MountedTest, {
      // mocks: {
      //   mounted() {},
      // },
    });

    await nextTick(); // <- Await the render loop
    const logSpy = jest.spyOn(console, "log");

    console.log(wrapper.find(".second").text());
    console.log("hello");

    expect(logSpy).toHaveBeenCalledWith("hello");
  });
});
