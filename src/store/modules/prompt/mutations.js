export default {
  SET_SELECTED_TEMPLATE(state,{id,name}){
    state.selectedTemplateId = id;
    state.selectedTemplateName = name;
  },
  RESET_SELECTIONS(state){
    state.selections = {};
  },
  SET_SELECTION(state,{key,value}){
    state.selections = { ...(state.selections||{}), [key]: value };
  },
};
