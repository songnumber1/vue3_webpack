function safeArray(v){ return Array.isArray(v)?v:[]; }

export default {
  templatesAll: (s)=> safeArray(s.templates),

  templatesForModel: (s,g)=>(modelId)=>{
    return g.templatesAll.filter((t)=> t.modelId === modelId && !t.delYN).sort((a,b)=>(a.promptTemplateOrder??0)-(b.promptTemplateOrder??0));
  },

  currentTemplate: (s,g,rs)=> {
    const modelId = rs.model?.modelId;
    const list = g.templatesForModel(modelId);
    if (!list.length) return null;
    const picked = list.find((x)=> x.promptTemplateId === s.selectedTemplateId);
    if (picked) return picked;
    // default template 우선
    return list.find((x)=> x.default) || list[0];
  },

  hasMultipleModes: (s,g,rs)=>{
    const modelId = rs.model?.modelId;
    const list = g.templatesForModel(modelId);
    return list.length > 1;
  },

  headerText: (s,g,rs)=>{
    const lang = rs.model?.language || "ko";
    const t = g.currentTemplate;
    const html = t?.promptTemplate?.html?.[lang] || {};
    return {
      title: html.title || t?.promptTemplateName || "",
      content: html.content || "",
    };
  },

  optionSchema: (s,g)=>{
    const t = g.currentTemplate;
    return t?.promptTemplate?.schema || {};
  },

  selectedOptions: (s)=> s.selections || {},
};
