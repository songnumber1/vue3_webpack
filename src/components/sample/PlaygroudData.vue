<template>
  <section class="card">
    <div class="card-head">
      <div class="card-title">Breakpoint Preview</div>
      <div class="card-sub">
        sm / md / lg 환경에서 컴포넌트가 어떻게 보이는지 확인
      </div>
    </div>

    <div class="row">
      <div class="kv">
        <div class="k">Current</div>
        <div class="v">
          <span class="badge" :class="`badge-${bpLabel}`">{{
            bpLabel.toUpperCase()
          }}</span>
          <span class="hint">({{ width }}px)</span>
        </div>
      </div>

      <div class="kv">
        <div class="k">Rules</div>
        <div class="v hint">sm: &lt; 768, md: 768~991, lg: ≥ 992</div>
      </div>
    </div>

    <div class="preview-wrap">
      <div class="preview">
        <div class="preview-title">Buttons</div>
        <div class="preview-body">
          <div class="btn-row">
            <button class="btn btn-primary btn-sm">Primary SM</button>
            <button class="btn btn-primary btn-md">Primary MD</button>
            <button class="btn btn-primary btn-lg">Primary LG</button>
          </div>

          <div class="btn-row">
            <button class="btn btn-ghost btn-sm">Ghost SM</button>
            <button class="btn btn-ghost btn-md">Ghost MD</button>
            <button class="btn btn-ghost btn-lg">Ghost LG</button>
          </div>

          <div class="btn-row">
            <button class="btn btn-danger btn-sm">Danger SM</button>
            <button class="btn btn-danger btn-md">Danger MD</button>
            <button class="btn btn-danger btn-lg">Danger LG</button>
          </div>

          <div class="btn-row">
            <button class="btn btn-primary btn-md" disabled>Disabled</button>
            <button class="btn btn-ghost btn-md" disabled>Disabled</button>
          </div>
        </div>
      </div>

      <div class="preview">
        <div class="preview-title">Labels / Badges</div>
        <div class="preview-body">
          <div class="label-row">
            <span class="label label-sm">Label SM</span>
            <span class="label label-md">Label MD</span>
            <span class="label label-lg">Label LG</span>
          </div>

          <div class="label-row">
            <span class="badge badge-sm">badge</span>
            <span class="badge badge-md">badge</span>
            <span class="badge badge-lg">badge</span>
          </div>

          <div class="label-row">
            <span class="badge badge-success">success</span>
            <span class="badge badge-warn">warn</span>
            <span class="badge badge-danger">danger</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PlaygroudData",

  props: {
    bpLabel: { type: String, default: "md" },
    width: { type: Number, default: 1200 },
  },
};
</script>
