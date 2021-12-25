<template>
  <div>
    <a-row class="single-row">
      <a-col :span="5">
        <a-button :title="'容器名称'" type="link" style="width: 100%">
          <span>
            容器名称
          </span>
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button :title="'容器镜像'" style="width: 100%" type="link">
          <span class="overflow-hidden">
            容器镜像
          </span>
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button :title="'容器镜像'" style="width: 100%" type="link">
          <span class="overflow-hidden">
            资源监控
          </span>
        </a-button>
      </a-col>
    </a-row>
<!--    <a-divider style="height: 2px; background-color: #7cb305"/>-->
  </div>
</template>

<script>
import containerResourceStats from '@/components/containerResourceStats';
import axios from "axios";
import {v4} from "uuid";

export default {
  name: "containerInfoHeader",
  components: {
    // containerResourceStats
  },
};
</script>

<style scoped>
.single-row {
  height: 36px;
}

.ant-divider-horizontal {
  margin: 5px 0;
}

.overflow-hidden {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.span-red {
  color: red;
}

.span-green {
  color: #4efc18;
}
</style>
