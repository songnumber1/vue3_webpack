import {shallowMount} from "@vue/test-utils";
import Jest from "@/components/Jest/Jest.vue";

describe("Jest.vue", () => {
  it("리턴값이 void이며 refs를 참조한다.", () => {
    const msg = "new message";
    const wrapper = shallowMount(Jest, {
      props: {msg},
    });

    const spy = jest
      .spyOn(wrapper.vm, "voidRefsFunc")
      .mockImplementation(() => {
        expect(spy).toHaveBeenCalledWith();
      });

    // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    wrapper.vm.voidRefsFunc();

    expect(wrapper.vm.voidRefsFunc).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.voidRefsFunc).toHaveBeenCalled();
    expect(wrapper.vm.voidRefsFunc).toHaveBeenCalledWith();

    // 아래와 같이 하면 실제로 메서드를 실행한다.
    // 하지만 오류 발생하며 오류 내용은 TypeError: Cannot read properties of undefined (reading 'tgmp')
    // jest.spyOn(Jest.methods, "voidRefsFunc");

    // // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    // Jest.methods.voidRefsFunc();
    // expect(Jest.methods.voidRefsFunc).toHaveBeenCalledTimes(1);
  });

  it("리턴값이 int이며 refs를 참조한다.", () => {
    const wrapper = shallowMount(Jest);

    const result = wrapper.vm.returnIntRefsFunc(123);

    expect(result).toBe(123);
  });

  it("리턴값이 int이며 refs를 참조하지 않는다.", () => {
    jest.spyOn(Jest.methods, "returnIntFunc");

    // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    const result = Jest.methods.returnIntFunc(123);
    expect(result).toBe(123);
    expect(Jest.methods.returnIntFunc).toHaveBeenCalledTimes(1);
  });

  it("Compute reversedMessage1", () => {
    jest.spyOn(Jest.computed, "reversedMessage1");

    // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    const result = Jest.computed.reversedMessage1();
    expect(result).toBe("1234");
  });

  it("Watch message", () => {
    jest.spyOn(Jest.watch, "message");

    // const spy = jest.spyOn(Jest.watch, "message").mockImplementation(() => {
    //   expect(spy).toHaveBeenCalledWith("1111");
    // });

    // 위에 spy 주석 처리하면 아래 내용은 모두 fail이다.
    // toHaveBeen~은 mock 또는 spy로 할 때 정상적으로 동작한다.
    Jest.watch.message("1111");
    expect(Jest).toBeTruthy();
  });
});
