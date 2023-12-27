import {shallowMount} from "@vue/test-utils";
import Jest from "@/components/Jest.vue";

describe("Jest.vue", () => {
  it("void 타입", () => {
    const msg = "new message";
    const wrapper = shallowMount(Jest, {
      props: {msg},
    });

    const spy = jest
      .spyOn(wrapper.vm, "divHeightChange")
      .mockImplementation(() => {
        expect(spy).toHaveBeenCalledWith();
      });

    // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    wrapper.vm.divHeightChange();
    expect(wrapper.vm.divHeightChange).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.divHeightChange).toHaveBeenCalled();
    expect(wrapper.vm.divHeightChange).toHaveBeenCalledWith();
  });

  it("int 타입", () => {
    const wrapper = shallowMount(Jest);

    const result = wrapper.vm.divHeightChange1(123);

    expect(result).toBe(123);
  });
});
